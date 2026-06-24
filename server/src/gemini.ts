import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[Gemini] API key not configured. Set GEMINI_API_KEY in .env');
}

const client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const TEXT_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

/**
 * Envuelve audio PCM crudo (lo que devuelve el modelo TTS) en un contenedor WAV
 * para que cualquier navegador lo pueda reproducir con <audio>.
 */
function pcmToWav(pcmBase64: string, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const pcm = Buffer.from(pcmBase64, 'base64');
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // tamaño del subchunk fmt
  header.writeUInt16LE(1, 20); // formato de audio = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Convierte un guion de texto en un audio narrado usando el modelo TTS de Gemini.
 * Devuelve un data URL `data:audio/wav;base64,...` listo para un <audio src>.
 * Se usa REST directo porque el SDK @google/generative-ai no expone responseModalities AUDIO.
 */
async function textToSpeech(script: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: script }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: any = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `TTS HTTP ${res.status}`);
  }

  const part = data?.candidates?.[0]?.content?.parts?.[0];
  const audioBase64: string | undefined = part?.inlineData?.data;
  if (!audioBase64) {
    throw new Error('El modelo TTS no devolvió audio');
  }

  // El mime suele ser "audio/L16;codec=pcm;rate=24000": parseamos el sample rate.
  const mime: string = part?.inlineData?.mimeType || '';
  const rateMatch = mime.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;

  const wav = pcmToWav(audioBase64, sampleRate);
  return `data:audio/wav;base64,${wav.toString('base64')}`;
}

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

    // Para audio el guion debe ser breve: el TTS genera el audio completo en una sola
    // respuesta y un texto largo produce archivos muy pesados. ~120 palabras ≈ 1 minuto.
    audio: `Escribe un guion narrado breve y didáctico (máximo 120 palabras, alrededor de 1 minuto al leerse en voz alta) que explique el siguiente contenido para un estudiante de secundaria. Devuelve SOLO el texto a narrar, sin acotaciones, sin títulos y sin marcas de formato:

${originalContent}`,
  };

  try {
    const model = client.getGenerativeModel({ model: TEXT_MODEL });
    const result = await model.generateContent(prompts[format]);
    const text = result.response.text();

    // El formato "audio" da un paso extra: convierte el guion generado en voz real.
    if (format === 'audio') {
      return await textToSpeech(text);
    }

    return text;
  } catch (error) {
    console.error('[Gemini] Error:', error);
    throw new Error(`Error generando contenido adaptado: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
