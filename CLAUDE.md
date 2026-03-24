# KarIA Scout — Documento de Orquestación

> Este archivo es leído automáticamente por Claude Code al abrir el proyecto.
> Define las reglas, el estado actual del desarrollo y las instrucciones para cada agente.
> **No modificar sin revisar con el equipo.**

---

## Qué es KarIA Scout

Agente de inteligencia comercial desarrollado por **KarIA**, orientado a equipos de ventas
de empresas de electrodomésticos en Argentina. Permite buscar y comparar precios de productos
en las principales cadenas (Naldo, OnCity, Cetrogar, Megatone, Frávega) en tiempo real,
con links directos a cada producto.

Forma parte de la suite **KarIA**:
- KarIA Agent — agente conversacional base
- KarIA Reach — prospección y cold outreach
- **KarIA Scout** — inteligencia competitiva de precios ← este proyecto

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20 (Alpine) |
| Framework | Express 4 |
| IA | Claude API (`claude-haiku-4-5`) via `@anthropic-ai/sdk` |
| Base de datos | Supabase (PostgreSQL + Storage) |
| Autenticación | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Google | Gmail, Calendar, Drive, Contacts (`googleapis`) |
| Archivos | ExcelJS, docx |
| Presentaciones | Gamma AI |
| Frontend | React + Vite |
| Contenedores | Docker + Docker Compose |
| Seguridad | Helmet, express-rate-limit, circuit breakers |

---

## Las 11 Bases de Desarrollo — Reglas absolutas

Todo el código de este proyecto cumple estas 11 bases sin excepción.
Un agente que rompe una base debe corregirlo antes de continuar.

| # | Base | Regla resumida |
|---|------|----------------|
| 1 | Arquitectura por capas | routes → controllers → services → repositories → integrations |
| 2 | Errores centralizados | Todo error pasa por errorHandler. Clase AppError siempre. |
| 3 | Secrets externalizados | Solo config/index.js toca process.env. Nunca en otro archivo. |
| 4 | Validación en la frontera | express-validator en cada route. Helmet + CORS con lista blanca. |
| 5 | Migraciones versionadas | Cada cambio de schema = archivo SQL numerado en /migrations |
| 6 | Código legible por IA | Máx. 150 líneas por archivo. Una función, un propósito. |
| 7 | Contratos explícitos | JSDoc obligatorio en services/ e integrations/. |
| 8 | Run & See inmediato | docker-compose up --build levanta todo en menos de 60 segundos. |
| 9 | Auth y tokens seguros | JWT 8h, bcrypt 12 rounds, refresh tokens solo server-side. |
| 10 | Sin CVEs conocidos | npm audit bloquea en high/critical. Versiones exactas en package.json. |
| 11 | Estilo consistente | ESLint + Prettier + Husky. Sin esto no entra código al repo. |

---

## Estructura de carpetas — obligatoria

```
karia-scout/
├── CLAUDE.md                  ← este archivo
├── AGENTS.md                  ← instrucciones detalladas por agente
├── .env.example               ← todas las variables, sin valores reales
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json               ← versiones exactas, sin rangos ^
├── README.md
├── migrations/                ← SQL versionado (Base 5)
├── scripts/                   ← utilidades de setup y migración
└── src/
    ├── server.js              ← entry point: puerto, arranque
    ├── app.js                 ← Express: middlewares globales, rutas
    ├── agent.js               ← loop principal del agente Claude
    ├── config/
    │   └── index.js           ← ÚNICO lugar que lee process.env
    ├── routes/                ← solo routing + middleware de validación
    ├── controllers/           ← orquestación, sin lógica de negocio
    ├── services/              ← toda la lógica de negocio
    ├── repositories/          ← único punto de contacto con Supabase
    ├── integrations/          ← wrappers de APIs externas
    ├── middleware/            ← auth, validación, rate limiting, errores
    ├── tools/                 ← herramientas del agente Claude
    │   ├── search.js
    │   ├── excel.js
    │   ├── export.js
    │   ├── gamma.js
    │   ├── scrapers/
    │   │   ├── naldo.js
    │   │   └── oncity.js
    │   └── google/
    │       ├── auth.js
    │       ├── gmail.js
    │       ├── calendar.js
    │       ├── drive.js
    │       └── contactos.js
    └── utils/
        ├── logger.js          ← logger centralizado [timestamp][NIVEL][módulo]
        ├── circuitBreaker.js
        ├── reintentos.js
        ├── storage.js
        └── limpiarTmp.js
```

---

## Estado del desarrollo — fases

### ✅ Base 1 — EN CURSO
**Cimientos del proyecto**
Scaffold, config, error handler, linter, Docker.
Ver `AGENTS.md` → sección "Agentes Base 1" para las instrucciones detalladas.

### ⏳ Base 2 — PENDIENTE (arrancar cuando Base 1 esté completa)
Auth, JWT, migraciones Supabase, agente Claude base.
Los agentes de Base 2 se definen en `AGENTS.md` una vez terminada Base 1.

### ⏳ Base 3 — PENDIENTE
Herramientas del agente: scrapers, Google Workspace, Excel/Word.

### ⏳ Base 4 — PENDIENTE
Frontend React + Vite, interfaz de chat, features avanzados.

---

## Reglas de convivencia entre agentes

1. **Cada agente toca solo su scope** — definido en AGENTS.md. Si necesita algo de otra capa, lo pide a través del contrato (JSDoc/import), no lo escribe él.
2. **config/ es intocable** — solo Arch Agent escribe en config/index.js. Todos los demás solo importan desde ahí.
3. **Nunca process.env fuera de config/** — si aparece en cualquier otro archivo, es un error.
4. **AppError siempre** — ningún agente lanza errores con `throw new Error('string')`. Solo `throw new AppError(...)`.
5. **Máximo 150 líneas por archivo** — si un archivo crece más, el agente lo divide antes de entregar.
6. **Commits convencionales** — `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`. Sin excepción.
7. **npm audit antes de cualquier install** — si hay CVEs high/critical, no se instala sin reportarlo.
