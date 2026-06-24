import { Router } from 'express';
import { prisma } from './db.ts';
import { requireAuth } from './auth.ts';
import type { ProfileInputs, ProfileDimensions, ProfileResult } from './types.ts';

const router = Router();

type ArchetypeDefinition = {
  name: string;
  description: string;
  rules: Array<{ dim: keyof ProfileDimensions; target: 'high' | 'low' }>;
};

const archetypes: Record<string, ArchetypeDefinition> = {
  explorador: {
    name: 'Explorador autónomo',
    description: 'Le gusta investigar, elige ideas grandes y trabaja mejor con metas claras y libertad.',
    rules: [
      { dim: 'MI', target: 'high' },
      { dim: 'AR', target: 'high' },
      { dim: 'EST', target: 'low' },
    ],
  },
  constructor: {
    name: 'Constructor con andamiaje',
    description: 'Aprende mejor cuando el material viene en pasos cortos y con estructura progresiva.',
    rules: [
      { dim: 'MC', target: 'high' },
      { dim: 'AR', target: 'low' },
      { dim: 'EST', target: 'high' },
    ],
  },
  ansioso: {
    name: 'Ansioso capaz',
    description: 'Se beneficia de un tono tranquilo, ejemplos que reduzcan la presión y confianza en el proceso.',
    rules: [
      { dim: 'AE', target: 'high' },
      { dim: 'ANS', target: 'high' },
    ],
  },
  pragmatico: {
    name: 'Pragmático',
    description: 'Necesita entender para qué sirve cada concepto y cómo aplicarlo en la vida real.',
    rules: [
      { dim: 'MI', target: 'low' },
      { dim: 'UTIL', target: 'high' },
    ],
  },
  colaborativo: {
    name: 'Colaborativo',
    description: 'Aprende mejor cuando puede conversar, comparar ideas y explicar con otros.',
    rules: [
      { dim: 'COL', target: 'high' },
    ],
  },
};

function normalize(value: number) {
  return (value - 1) / 4;
}

function average(values: number[]) {
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function computeDimensions(inputs: ProfileInputs): ProfileDimensions {
  const get = (key: string) => Number(inputs.answers[key] ?? 3);

  const item1 = get('q1');
  const item2 = 6 - get('q2');
  const item3 = get('q3');
  const item4 = get('q4');
  const item5 = 6 - get('q5');
  const item6 = get('q6');
  const item7 = 6 - get('q7');
  const item8 = get('q8');
  const item9 = get('q9');
  const item10 = get('q10');
  const item11 = get('q11');

  const valorFormaDeTrabajo = inputs.trabajo === 'En grupo' ? 5 : inputs.trabajo === 'Depende' ? 3 : 1;

  return {
    MI: average([item1, item2]),
    UTIL: item3,
    MC: average([item4, item5]),
    AR: average([item6, item7]),
    EST: item8,
    COL: average([item9, valorFormaDeTrabajo]),
    ANS: item10,
    AE: item11,
  };
}

function getDimensionLabel(value: number) {
  if (value >= 3.5) return 'alto';
  if (value <= 2.5) return 'bajo';
  return 'medio';
}

// Significado legible de cada dimensión (las claves cortas se mantienen en los datos).
const DIM_LABELS: Record<string, string> = {
  MI: 'Inteligencias Múltiples',
  UTIL: 'Utilidad / Orientación práctica',
  MC: 'Metacognición',
  AR: 'Análisis / Reflexión',
  EST: 'Estrategia',
  COL: 'Colaboración',
  ANS: 'Ansiedad / Motivación',
  AE: 'Autonomía / Autoeficacia',
};

type ArchetypeDerivation = {
  arquetipo: string;
  arquetipoDescripcion: string;
  arquetipoSecundario?: string;
  dimensionesDominantes: string[];
};

// Calcula arquetipo, descripción y dimensiones dominantes a partir SOLO de las
// dimensiones. Se usa tanto al crear el perfil (POST) como al recuperarlo (GET /me),
// para que la pantalla muestre lo mismo en ambos casos.
function deriveArchetype(dims: ProfileDimensions): ArchetypeDerivation {
  const normalized = Object.fromEntries(
    Object.entries(dims).map(([key, value]) => [key, normalize(value)])
  ) as Record<keyof ProfileDimensions, number>;

  const scores = Object.entries(archetypes).map(([key, archetype]) => {
    const total = archetype.rules.reduce((sum, rule) => {
      const value = normalized[rule.dim];
      return sum + (rule.target === 'high' ? value : 1 - value);
    }, 0);
    return { key, score: total / archetype.rules.length };
  });

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const second = scores[1];
  const arquetipo = archetypes[best.key];

  const dimensionesDominantes = Object.entries(dims)
    .map(([key, value]) => ({ key, distance: Math.abs(value - 3), value }))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 3)
    .map((item) => `${DIM_LABELS[item.key] ?? item.key} (${getDimensionLabel(item.value)})`);

  const result: ArchetypeDerivation = {
    arquetipo: arquetipo.name,
    arquetipoDescripcion: arquetipo.description,
    dimensionesDominantes,
  };

  if (second && best.score - second.score < 0.12) {
    result.arquetipoSecundario = archetypes[second.key].name;
  }

  return result;
}

function computeProfile(inputs: ProfileInputs): ProfileResult {
  const dims = computeDimensions(inputs);
  const derived = deriveArchetype(dims);

  return {
    dims,
    ...derived,
    formato: inputs.formato,
    trabajo: inputs.trabajo,
    intereses: inputs.intereses,
  };
}

router.post('/', requireAuth, async (req, res) => {
  const { answers, formato, trabajo, intereses } = req.body;
  if (!answers || !formato || !trabajo) {
    return res.status(400).json({ error: 'Faltan datos del perfil' });
  }

  const profileData = computeProfile({ answers, formato, trabajo, intereses });
  const existing = await prisma.profile.findUnique({ where: { userId: req.userId } });

  const stored = {
    dims: JSON.stringify(profileData.dims),
    arquetipo: profileData.arquetipo,
    formato: JSON.stringify(profileData.formato),
    trabajo: profileData.trabajo,
    intereses: profileData.intereses,
  };

  if (existing) {
    await prisma.profile.update({
      where: { userId: req.userId },
      data: stored,
    });
  } else {
    await prisma.profile.create({
      data: {
        userId: req.userId,
        ...stored,
      },
    });
  }

  return res.json({ profile: profileData });
});

router.get('/me', requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
  if (!profile) {
    return res.json({ profile: null });
  }

  const dims = JSON.parse(profile.dims) as ProfileDimensions;
  const derived = deriveArchetype(dims);

  return res.json({
    profile: {
      dims,
      ...derived,
      formato: JSON.parse(profile.formato),
      trabajo: profile.trabajo,
      intereses: profile.intereses,
    },
  });
});

export default router;
export { computeProfile };
