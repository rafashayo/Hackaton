import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function createToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '8h' });
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

router.post('/register', async (req, res) => {
  const { name, email, password, role, course } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role === 'docente' ? 'docente' : 'alumno',
      course,
    },
  });

  const token = createToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, course: user.course } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: 'Email o contraseña incorrectos' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(400).json({ error: 'Email o contraseña incorrectos' });
  }

  const token = createToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, course: user.course } });
});

export default router;
