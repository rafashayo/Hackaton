import { Router } from 'express';
import { prisma } from './db.ts';
import { requireAuth } from './auth.ts';
import { adaptContent } from './gemini.ts';

const router = Router();

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
    res.status(500).json({ error: 'Error al generar contenido adaptado' });
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

export default router;
