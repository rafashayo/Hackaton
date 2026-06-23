# Aprendizaje Adaptativo

App escolar para que un docente cargue material y la IA lo adapte al perfil del alumno.

## Fase 1 - MVP
- Registro / login básico
- Formulario de perfil con 13 preguntas y dimensiones calculadas
- Guardado de perfil en SQLite
- Visualización de arquetipo y dimensiones

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
