import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRouter from './auth.ts';
import profileRouter from './profile.ts';
import teacherRouter from './teacher.ts';
import studentRouter from './student.ts';
import materialRouter from './material.ts';
import { prisma } from './db.ts';

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((value) => value.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/teacher', teacherRouter);
app.use('/student', studentRouter);
app.use('/material', materialRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend de Aprendizaje Adaptativo' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(port, async () => {
  console.log(`Server escuchando en http://localhost:${port}`);
  await prisma.$connect();
});
