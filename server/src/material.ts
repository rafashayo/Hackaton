import { Router } from 'express';
import { prisma } from './db.ts';
import { requireAuth } from './auth.ts';
import { adaptContent, answerQuestion } from './gemini.ts';
import type { ChatTurn } from './gemini.ts';

const router = Router();

// Devuelve un mensaje amigable distinguiendo el caso de cuota de IA agotada.
function friendlyAiError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (/429|quota|Too Many/i.test(error.message)) {
      return 'La IA llegó al límite gratuito por ahora. Probá de nuevo en un rato.';
    }
    if (/no configurada/i.test(error.message)) {
      return 'La IA no está configurada en el servidor (falta GEMINI_API_KEY).';
    }
  }
  return fallback;
}

// Middleware: verificar que es docente
async function requireTeacher(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'docente') {
    return res.status(403).json({ error: 'Solo docentes pueden crear materiales' });
  }
  req.user = user;
  next();
}

// POST /material - Crear nuevo material (docente)
router.post('/', requireAuth, requireTeacher, async (req, res) => {
  const { title, content, subject, level } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido son requeridos' });
  }

  try {
    const material = await prisma.material.create({
      data: {
        title,
        content,
        subject: subject || 'General',
        level: level || 'Secundaria',
        teacherId: req.userId,
      },
    });

    res.status(201).json({ material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear material' });
  }
});

// GET /material - Listar materiales (docente: los propios; alumno: los de sus docentes activos)
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ error: 'No autorizado' });

    if (user.role === 'docente') {
      const materials = await prisma.material.findMany({
        where: { teacherId: req.userId },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ materials });
    }

    // Alumno: obtener IDs de sus docentes activos
    const relations = await prisma.studentTeacher.findMany({
      where: { studentId: req.userId, status: 'active' },
      select: { teacherId: true },
    });
    const teacherIds = relations.map((r) => r.teacherId);

    const materials = await prisma.material.findMany({
      where: { teacherId: { in: teacherIds } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ materials });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
});

// GET /material/:id - Obtener material específico
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    res.json({ material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener material' });
  }
});

// POST /material/:id/adapt - Generar contenido adaptado
router.post('/:id/adapt', requireAuth, async (req, res) => {
  const { format } = req.body;

  if (!format || !['resumen', 'explicacion', 'ejercicios', 'ejemplos', 'esquema', 'audio'].includes(format)) {
    return res.status(400).json({ error: 'Formato inválido' });
  }

  try {
    const material = await prisma.material.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    // Devolver desde caché si ya existe
    const cached = await prisma.adaptedContent.findFirst({
      where: { materialId: material.id, studentId: req.userId, format },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) {
      return res.json({
        format,
        content: cached.content,
        material: { title: material.title, subject: material.subject },
        cached: true,
      });
    }

    // Obtener perfil del estudiante para personalización
    const studentProfile = await prisma.profile.findUnique({
      where: { userId: req.userId },
    });

    // Generar contenido adaptado con Gemini
    const adaptedText = await adaptContent(
      material.content,
      format as any,
      studentProfile ? { arquetipo: studentProfile.arquetipo } : undefined
    );

    // Guardar en BD
    const adapted = await prisma.adaptedContent.create({
      data: {
        materialId: material.id,
        studentId: req.userId,
        format,
        content: adaptedText,
      },
    });

    res.status(201).json({
      format,
      content: adaptedText,
      material: { title: material.title, subject: material.subject },
    });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: friendlyAiError(error, 'Error al generar contenido adaptado') });
  }
});

// GET /material/:id/adapted - Ver contenidos adaptados de un material
router.get('/:id/adapted', requireAuth, async (req, res) => {
  try {
    const adapted = await prisma.adaptedContent.findMany({
      where: {
        materialId: parseInt(req.params.id),
        studentId: req.userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ adapted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener contenido adaptado' });
  }
});

// POST /material/:id/chat - Preguntarle al asistente de estudio sobre el material
router.post('/:id/chat', requireAuth, async (req, res) => {
  const { question, history } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Falta la pregunta' });
  }

  try {
    const material = await prisma.material.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    const turns: ChatTurn[] = Array.isArray(history)
      ? history
          .filter((t) => t && (t.role === 'user' || t.role === 'model') && typeof t.text === 'string')
          .map((t) => ({ role: t.role, text: t.text }))
      : [];

    const answer = await answerQuestion(material.content, question.trim(), turns);
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: friendlyAiError(error, 'No pude responder ahora. Reintentá en unos segundos.') });
  }
});

// DELETE /material/:id - Eliminar un material (solo el docente dueño)
router.delete('/:id', requireAuth, requireTeacher, async (req, res) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!material || material.teacherId !== req.userId) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    // Las adaptaciones asociadas se borran en cascada (ver schema.prisma).
    await prisma.material.delete({ where: { id: material.id } });
    res.json({ message: 'Material eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar material' });
  }
});

export default router;
