import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[Gemini] API key not configured. Set GEMINI_API_KEY in .env');
}

const client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function adaptContent(
  originalContent: string,
  format: 'resumen' | 'explicacion' | 'ejercicios' | 'ejemplos' | 'esquema' | 'audio',
  studentProfile?: { arquetipo?: string; nivel?: string }
): Promise<string> {
  if (!client) {
    return 'API de Gemini no configurada. Por favor configura GEMINI_API_KEY en .env';
  }

  const prompts = {
    resumen: `Resume el siguiente contenido en 3-4 párrafos cortos y claros para un estudiante de secundaria:

${originalContent}

Sé conciso y destaca los conceptos clave.`,

    explicacion: `Explica el siguiente contenido de forma sencilla y accesible. Utiliza ejemplos del día a día:

${originalContent}

Usa un tono conversacional y fácil de entender.`,

    ejercicios: `Genera 5 ejercicios prácticos basados en el siguiente contenido. Incluye:
- 2 preguntas de opción múltiple
- 2 preguntas de verdadero/falso
- 1 problema a resolver

Contenido:
${originalContent}`,

    ejemplos: `Crea 3 ejemplos reales y prácticos basados en el siguiente contenido. Los ejemplos deben ser situaciones de la vida cotidiana que puedan vivenciar estudiantes de secundaria:

${originalContent}`,

    esquema: `Crea un esquema conceptual jerárquico del siguiente contenido usando texto plano (con guiones y indentación):

${originalContent}

Formato:
Tema principal
├── Subtema 1
│   ├── Concepto
│   └── Concepto
└── Subtema 2`,

    audio: `Crea un guion narrado (como si fuera un audio de podcast educativo) basado en el siguiente contenido. Debe durar aproximadamente 3-5 minutos de lectura:

${originalContent}

Usa un tono amigable y didáctico.`,
  };

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const result = await model.generateContent(prompts[format]);
    const text = result.response.text();
    return text;
  } catch (error) {
    console.error('[Gemini] Error:', error);
    throw new Error(`Error generando contenido adaptado: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
