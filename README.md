# Aprendizaje Adaptativo

App escolar para que un docente cargue material y la IA lo adapte al perfil del alumno.

## Fase 1 - MVP
- Registro / login básico
- Formulario de perfil con 13 preguntas y dimensiones calculadas
- Guardado de perfil en SQLite
- Visualización de arquetipo y dimensiones

## Front Discere

El cliente implementa la identidad de marca **Discere** (fuentes Fredoka + Nunito,
paleta navy/naranja/celeste/crema, botones 3D e ilustraciones de materias).

Pantallas:

- **Alumno:** Inicio · Senda de la clase · Lección con feedback de IA · Recompensa (XP + racha) · Perfil de aprendizaje
- **Docente:** Panel de clase (semáforo + alertas de IA) · Detalle de alumno (recorrido, puntos de fricción, dominio por habilidad)

El diseño de marca y los assets viven en el repo `FrontHackaton`. Las pantallas de
senda, lección, recompensa y seguimiento docente usan datos de demostración
(`client/src/data/demo.ts`) mientras el backend resuelve autenticación y perfil.

## Cómo correr

1. Copia el archivo de ejemplo:

```powershell
copy .env.example .env
```

2. Instala dependencias:

```powershell
npm install
```

3. Genera Prisma y la base de datos:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

4. Ejecuta la app:

```powershell
npm run dev:server
npm run dev:client
```

5. Abre el frontend en `http://localhost:5173`.

## Notas
- La API key de Anthropic se implementará en fases posteriores en el backend.
- El perfil se guarda como "una foto del momento"; puede ajustarse más adelante.
