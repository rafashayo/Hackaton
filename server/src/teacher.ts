import { Router } from 'express';
import { prisma } from './db.ts';
import { requireAuth } from './auth.ts';

const router = Router();

// Middleware: verificar que es docente
async function requireTeacher(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'docente') {
    return res.status(403).json({ error: 'Solo docentes pueden acceder' });
  }
  req.user = user;
  next();
}

// GET /teacher/students - Ver mis estudiantes
router.get('/students', requireAuth, requireTeacher, async (req, res) => {
  try {
    const studentTeachers = await prisma.studentTeacher.findMany({
      where: { teacherId: req.userId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            course: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      students: studentTeachers.map((st) => ({
        id: st.id,
        status: st.status,
        createdAt: st.createdAt,
        student: st.student,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// PUT /teacher/students/:id/status - Aceptar/Rechazar estudiante
router.put('/students/:id/status', requireAuth, requireTeacher, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const studentTeacher = await prisma.studentTeacher.findUnique({
      where: { id: parseInt(id) },
    });

    if (!studentTeacher || studentTeacher.teacherId !== req.userId) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }

    const updated = await prisma.studentTeacher.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { student: { select: { id: true, name: true, email: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
});

// DELETE /teacher/students/:id - Desvincular a un alumno (el :id es la relación)
router.delete('/students/:id', requireAuth, requireTeacher, async (req, res) => {
  try {
    const relation = await prisma.studentTeacher.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    // Solo el docente dueño de la relación puede desvincular
    if (!relation || relation.teacherId !== req.userId) {
      return res.status(404).json({ error: 'Vínculo no encontrado' });
    }

    await prisma.studentTeacher.delete({ where: { id: relation.id } });
    res.json({ message: 'Alumno desvinculado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desvincular alumno' });
  }
});

export default router;
