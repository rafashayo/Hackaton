import { Router } from 'express';
import { prisma } from './db.ts';
import { requireAuth } from './auth.ts';

const router = Router();

// GET /student/teachers - Ver mis docentes
router.get('/teachers', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'alumno') {
      return res.status(403).json({ error: 'Solo alumnos pueden acceder' });
    }

    const studentTeachers = await prisma.studentTeacher.findMany({
      where: { studentId: req.userId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            course: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      teachers: studentTeachers.map((st) => ({
        id: st.id,
        status: st.status,
        createdAt: st.createdAt,
        teacher: st.teacher,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener docentes' });
  }
});

// GET /student/available-teachers - Buscar docentes disponibles
router.get('/available-teachers', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'alumno') {
      return res.status(403).json({ error: 'Solo alumnos pueden acceder' });
    }

    // Obtener todos los docentes que no están relacionados con este alumno
    const allTeachers = await prisma.user.findMany({
      where: { role: 'docente' },
      select: { id: true, name: true, email: true, course: true },
    });

    const existingTeachers = await prisma.studentTeacher.findMany({
      where: { studentId: req.userId },
      select: { teacherId: true },
    });

    const existingTeacherIds = existingTeachers.map((st) => st.teacherId);
    const available = allTeachers.filter((t) => !existingTeacherIds.includes(t.id));

    res.json({ teachers: available });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener docentes disponibles' });
  }
});

// POST /student/request-teacher - Solicitar vínculo con un docente
router.post('/request-teacher', requireAuth, async (req, res) => {
  const { teacherId } = req.body;

  if (!teacherId) {
    return res.status(400).json({ error: 'Se requiere teacherId' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'alumno') {
      return res.status(403).json({ error: 'Solo alumnos pueden acceder' });
    }

    // Verificar que el teacher existe
    const teacher = await prisma.user.findUnique({
      where: { id: parseInt(teacherId) },
    });
    if (!teacher || teacher.role !== 'docente') {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }

    // Verificar si ya existe la relación
    const existing = await prisma.studentTeacher.findUnique({
      where: { studentId_teacherId: { studentId: req.userId, teacherId: parseInt(teacherId) } },
    });
    if (existing) {
      return res.status(400).json({ error: 'Ya has solicitado a este docente' });
    }

    // Crear la relación
    const studentTeacher = await prisma.studentTeacher.create({
      data: {
        studentId: req.userId,
        teacherId: parseInt(teacherId),
        status: 'pending',
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({
      message: 'Solicitud enviada al docente',
      studentTeacher,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar solicitud' });
  }
});

// DELETE /student/teachers/:id - Desvincularse de un docente (el :id es la relación)
router.delete('/teachers/:id', requireAuth, async (req, res) => {
  try {
    const relation = await prisma.studentTeacher.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    // Solo el alumno dueño de la relación puede desvincularse
    if (!relation || relation.studentId !== req.userId) {
      return res.status(404).json({ error: 'Vínculo no encontrado' });
    }

    await prisma.studentTeacher.delete({ where: { id: relation.id } });
    res.json({ message: 'Te desvinculaste del docente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desvincularse' });
  }
});

export default router;
