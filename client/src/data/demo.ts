/* Datos de demostración fieles al diseño de marca Discere.
   El backend resuelve auth + perfil; estas pantallas de senda, lección,
   recompensa y seguimiento docente usan datos simulados para la demo. */

export const tasks = [
  { name: 'Repaso: Fracciones', meta: 'Recomendado por IA' },
  { name: 'Despeje de ecuaciones', meta: 'Lección · +20 XP' },
  { name: 'Desafío semanal', meta: 'Vence el viernes · +50 XP' },
  { name: 'Lectura: Proporciones', meta: 'Lección · +15 XP' },
];

export const classes = [
  { name: 'Matemática', active: true, prog: '48%' },
  { name: 'Lengua', active: false, prog: '90%' },
  { name: 'Tec. Emergentes', active: false, prog: '64%' },
  { name: 'Física', active: false, prog: '30%' },
  { name: 'Geografía', active: false, prog: '72%' },
  { name: 'Historia', active: false, prog: '55%' },
  { name: 'Ética', active: false, prog: '88%' },
  { name: 'Inglés', active: false, prog: '41%' },
];

/* ---- Senda (mapa de la unidad) ---- */
export type PathNode = {
  n: number;
  state: 'done' | 'current' | 'locked';
  left: number;
  top: number;
};
export const pathNodes: PathNode[] = [
  { n: 1, state: 'done', left: 112, top: 12 },
  { n: 2, state: 'done', left: 232, top: 222 },
  { n: 3, state: 'current', left: 50, top: 322 },
  { n: 4, state: 'locked', left: 248, top: 430 },
];

/* ---- Lección ---- */
export const lesson = {
  prompt: 'RESOLVÉ PARA X',
  equation: '2x + 6 = 14',
  options: [
    { label: 'x = 4', state: 'correct' as const },
    { label: 'x = 7', state: 'wrong' as const },
    { label: 'x = 10', state: 'idle' as const },
    { label: 'x = 3', state: 'idle' as const },
  ],
  feedbackTitle: 'Te trabaste al despejar',
  feedbackBody:
    'Restaste el 6 de un solo lado. Lo que hacés de un lado, también va del otro: 14 − 6 = 8, y luego 8 ÷ 2 = 4. Tu próximo ejercicio se ajustó a este error.',
};

/* ---- Panel docente ---- */
const fn = ['Mateo', 'Sofía', 'Benjamín', 'Valentina', 'Joaquín', 'Catalina', 'Thiago', 'Martina', 'Lucas', 'Emma', 'Bautista', 'Isabella', 'Santiago', 'Julieta', 'Bruno', 'Renata', 'Lautaro', 'Mía', 'Tomás', 'Olivia', 'Gael', 'Delfina', 'Ignacio', 'Abril', 'Felipe', 'Victoria', 'Dante', 'Jazmín', 'Nicolás', 'Camila'];
const lns = ['G.', 'R.', 'M.', 'P.', 'S.', 'L.', 'F.', 'D.', 'C.', 'A.', 'V.', 'T.', 'B.', 'N.', 'H.', 'Q.', 'Z.', 'O.', 'I.', 'E.'];
const avs = ['/brand/avatars/a1.png', '/brand/avatars/a2.png', '/brand/avatars/a3.png', '/brand/avatars/a4.png'];
const units = ['Fracciones', 'Ecuaciones', 'Geometría', 'Decimales', 'Proporciones'];

export type Student = {
  id: number;
  name: string;
  prog: number;
  barWidth: string;
  dot: string;
  status: 'ok' | 'warn' | 'risk';
  unit: string;
  av: string;
};

export const students: Student[] = fn.map((name, i) => {
  const prog = ((i * 29 + 23) % 94) + 5;
  const status: Student['status'] = prog < 42 ? 'risk' : prog < 68 ? 'warn' : 'ok';
  const dot = status === 'risk' ? '#E54B4B' : status === 'warn' ? '#F4B53F' : '#3FB97A';
  return {
    id: i,
    name: `${name} ${lns[i % lns.length]}`,
    prog,
    barWidth: `${prog}%`,
    dot,
    status,
    unit: units[i % units.length],
    av: avs[i % 4],
  };
});

export const okCount = students.filter((s) => s.status === 'ok').length;
export const warnCount = students.filter((s) => s.status === 'warn').length;
export const riskCount = students.filter((s) => s.status === 'risk').length;
export const avgProg = Math.round(students.reduce((a, s) => a + s.prog, 0) / students.length);

export const alerts = students
  .filter((s) => s.status === 'risk')
  .slice(0, 3)
  .map((s) => ({
    id: s.id,
    name: s.name,
    dot: s.dot,
    av: s.av,
    reason: `Se trabó en ${s.unit} · ${(s.prog % 3) + 2} intentos fallidos`,
  }));

/* ---- Detalle de alumno ---- */
export const friction = [
  { skill: 'Despeje de ecuaciones', detail: 'Resta el término de un solo lado de la igualdad', errors: '3 errores', sev: 'Fricción alta', col: '#E54B4B', bg: '#FCEBEA' },
  { skill: 'Fracciones equivalentes', detail: 'Confunde numerador y denominador al simplificar', errors: '2 errores', sev: 'Fricción media', col: '#F4B53F', bg: '#FEF6E6' },
  { skill: 'Propiedad distributiva', detail: 'Olvida multiplicar el segundo término', errors: '1 error', sev: 'Fricción baja', col: '#00A6ED', bg: '#E3F4FD' },
];

export const masterySkills = [
  { name: 'Suma y resta', pct: '100%', label: '100%', col: '#3FB97A' },
  { name: 'Multiplicación y división', pct: '92%', label: '92%', col: '#3FB97A' },
  { name: 'Ecuaciones lineales', pct: '48%', label: '48%', col: '#F4B53F' },
  { name: 'Fracciones', pct: '35%', label: '35%', col: '#E54B4B' },
  { name: 'Geometría básica', pct: '6%', label: '6%', col: '#E54B4B' },
];

export const activity = [
  { t: 'Hoy · 10:24', txt: 'Completó "Ecuaciones · Nivel 2" con 90% de precisión', col: '#3FB97A' },
  { t: 'Hoy · 10:12', txt: 'Se trabó 3 veces en el despeje de ecuaciones', col: '#E54B4B' },
  { t: 'Ayer · 18:40', txt: 'Mantuvo su racha de 8 días seguidos', col: '#FF5E00' },
  { t: 'Ayer · 18:05', txt: 'Subió a la Liga Oro', col: '#00A6ED' },
];

export const journeySteps = [
  { name: 'Sumas', state: 'done' as const },
  { name: 'Términos', state: 'done' as const },
  { name: 'Despeje', state: 'stuck' as const },
  { name: 'Sistemas', state: 'locked' as const },
];
