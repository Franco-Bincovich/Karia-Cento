# KarIA Scout

Agente de inteligencia competitiva de precios para equipos de ventas de electrodomésticos en Argentina. Busca, compara y exporta precios en tiempo real desde las principales cadenas del pais.

Forma parte de la suite **KarIA**:
- **KarIA Agent** — agente conversacional base
- **KarIA Reach** — prospeccion y cold outreach
- **KarIA Scout** — inteligencia competitiva de precios (este proyecto)

---

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Runtime | Node.js | 20 (Alpine) |
| Framework | Express | 4.22.1 |
| IA | Claude API via `@anthropic-ai/sdk` | 0.27.3 |
| Modelo | `claude-haiku-4-5` | - |
| Base de datos | Supabase (PostgreSQL + Storage) | 2.99.3 |
| Auth | JWT + bcrypt | 9.0.2 / 2.4.3 |
| Google | Gmail, Calendar, Drive, Contacts | googleapis 140.0.0 |
| Archivos | ExcelJS, docx | 4.4.0 / 8.5.0 |
| Seguridad | Helmet, express-rate-limit, CORS | 7.1.0 / 7.2.0 |
| Frontend | React + Vite | 18.3.1 / 5.4.21 |
| Contenedores | Docker + Docker Compose | - |

---

## Arquitectura

### Backend (`src/`)

```
src/
├── server.js              # Entry point: puerto, arranque, graceful shutdown
├── app.js                 # Express: middlewares globales, montaje de rutas
├── agent.js               # Loop principal del agente Claude con tool use
├── config/
│   └── index.js           # UNICO lugar que lee process.env (Base 3)
├── routes/                # Routing + validacion con express-validator
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── conversacionRoutes.js
│   └── filesRoutes.js
├── controllers/           # Orquestacion, sin logica de negocio
├── services/              # Logica de negocio
├── repositories/          # Unico punto de contacto con Supabase
├── middleware/             # Auth JWT, validacion, rate limiting, error handler
├── tools/                 # Herramientas del agente Claude
│   ├── search.js          # Orquestador de busqueda (ETAPA 1 + 2)
│   ├── excel.js           # Generacion de Excel generico
│   ├── excelComparacion.js # Excel comparativo de precios
│   ├── export.js          # Generacion de Word
│   ├── toolDefinitions/   # Schemas de tools para Anthropic API
│   ├── scrapers/
│   │   ├── vtex.js        # Scraper VTEX (Naldo, OnCity, Fravega, Musimundo)
│   │   ├── cetrogar.js    # Scraper Magento + web_search fallback
│   │   ├── mercadolibre.js # API oficial MercadoLibre (MLA)
│   │   └── webSearch.js   # Fallback con Claude web_search
│   └── google/            # Gmail, Calendar, Drive, Contactos
└── utils/
    ├── logger.js          # Winston: [timestamp][NIVEL][modulo]
    ├── circuitBreaker.js  # Proteccion de APIs externas
    ├── reintentos.js      # Retry con backoff
    └── limpiarTmp.js      # Limpieza de archivos temporales
```

### Frontend (`client/src/`)

```
client/src/
├── components/
│   ├── chat/              # MessageBubble, ChatWindow, InputBar
│   └── ui/                # FileDownloadButton, Sidebar, etc.
├── context/               # AuthContext (JWT en memoria)
├── hooks/                 # useAuth, useChat
├── pages/                 # Login, Chat, PrivateRoute
└── styles/                # globals.css (variables CSS KarIA)
```

---

## Sistema de busqueda de precios

### Flujo de 2 etapas

**ETAPA 1 — Busqueda general en paralelo**

Se ejecutan todos los scrapers en paralelo via `Promise.allSettled`:

| Tienda | Scraper | Metodo |
|--------|---------|--------|
| Naldo | VTEX | Session cookies + catalog API |
| OnCity | VTEX | Session cookies + catalog API |
| Fravega | VTEX | Session cookies + catalog API |
| Musimundo | VTEX | Session cookies + catalog API |
| Cetrogar | Magento | Suggest AJAX + web_search fallback |
| MercadoLibre | API oficial | `GET /sites/MLA/search` |
| Megatone | web_search | Claude web_search fallback |

**ETAPA 2 — Busqueda cruzada por modelo**

Para cada producto encontrado en ETAPA 1, se busca en las tiendas donde no aparecio:

1. Se extrae el codigo de modelo del nombre del producto (ej: `UN50U8000F`)
2. Si no hay codigo formal, se usa el modelo informal + pulgadas (ej: `50 Du7000`)
3. Se busca ese codigo en las tiendas faltantes
4. Busquedas VTEX/MeLi: en paralelo. Cetrogar: secuencial con 1s delay (rate limit)
5. Maximo 10 productos para busqueda cruzada

**Resultado unificado:**
```json
{ "nombre": "Smart TV Samsung 50...", "precios": { "naldo": 899999, "fravega": 879999, "cetrogar": null } }
```

### Scrapers

**VTEX** (`vtex.js`): Obtiene cookies via `POST /api/sessions`, luego busca en `/api/catalog_system/pub/products/search`. Headers minimos para evitar WAF.

**Cetrogar** (`cetrogar.js`): Intenta `catalogsearch` HTML, luego `suggest` AJAX, luego `web_search` como ultimo fallback. El endpoint suggest funciona mejor con queries de 1-2 palabras.

**MercadoLibre** (`mercadolibre.js`): API oficial con Bearer token opcional. Filtra `precio > 0`.

**web_search** (`webSearch.js`): Dos busquedas en paralelo por tienda (`site:` + generica) via Claude `web_search_20250305`. Deduplicacion por URL.

---

## Requisitos

- **Node.js** >= 20
- **npm** >= 9
- **Supabase** — proyecto con tablas `usuarios_old`, `conversaciones_old`, `mensajes`
- **Anthropic API key** — con acceso a `claude-haiku-4-5` y `web_search_20250305`
- **Docker** y **Docker Compose** (opcional, para produccion)

---

## Instalacion

```bash
# Clonar el repositorio
git clone <repo-url>
cd Scout-Cento

# Backend
cp .env.example .env
# Completar las variables en .env
npm install

# Frontend
cd client
npm install
cd ..
```

---

## Variables de entorno

| Variable | Descripcion | Obligatoria |
|----------|-------------|:-----------:|
| `PORT` | Puerto del servidor (default: 3002) | No |
| `NODE_ENV` | Entorno: development / production | No |
| `ALLOWED_ORIGINS` | Origenes CORS separados por coma | No |
| `JWT_SECRET` | Secret para firmar tokens JWT (min 32 chars en prod) | Si |
| `ANTHROPIC_API_KEY` | API key de Anthropic | Si |
| `SUPABASE_URL` | URL del proyecto Supabase | Si |
| `SUPABASE_KEY` | Service role key de Supabase | Si |
| `GOOGLE_CLIENT_ID_1` | OAuth2 Client ID — cuenta 1 | No |
| `GOOGLE_CLIENT_SECRET_1` | OAuth2 Client Secret — cuenta 1 | No |
| `GOOGLE_REFRESH_TOKEN_1` | OAuth2 Refresh Token — cuenta 1 | No |
| `GOOGLE_CLIENT_ID_2` | OAuth2 Client ID — cuenta 2 | No |
| `GOOGLE_CLIENT_SECRET_2` | OAuth2 Client Secret — cuenta 2 | No |
| `GOOGLE_REFRESH_TOKEN_2` | OAuth2 Refresh Token — cuenta 2 | No |
| `GOOGLE_REDIRECT_URI` | URI de redireccion OAuth2 | No |
| `GAMMA_API_KEY` | API key de Gamma AI para presentaciones | No |
| `MERCADOLIBRE_ACCESS_TOKEN` | Token de acceso MercadoLibre API | No |

---

## Como correr

```bash
# Backend (puerto 3002)
npm run dev

# Frontend (puerto 5174)
cd client && npm run dev

# Produccion con Docker
docker compose up --build
```

---

## Endpoints API

| Metodo | Ruta | Auth | Descripcion |
|--------|------|:----:|-------------|
| `GET` | `/health` | No | Health check (`{ status: 'ok' }`) |
| `POST` | `/api/auth/login` | No | Login con email + password. Rate limit: 10/15min |
| `POST` | `/api/auth/cambiar-password` | JWT | Cambiar password del usuario autenticado |
| `POST` | `/api/chat` | JWT | Enviar mensaje al agente. Rate limit: 20/min |
| `GET` | `/api/conversaciones` | JWT | Listar conversaciones del usuario |
| `GET` | `/api/conversaciones/:id` | JWT | Cargar mensajes de una conversacion |
| `GET` | `/api/files/download?file=nombre` | JWT | Descargar archivo generado (IDOR-protected) |

---

## Seguridad

| Medida | Implementacion |
|--------|---------------|
| Autenticacion | JWT con expiracion 8h, token solo en memoria React (no localStorage) |
| Passwords | bcrypt con 12 rounds |
| Rate limiting | Login: 10/15min, Chat: 20/min, API general: 100/15min |
| CORS | Whitelist explicita via `ALLOWED_ORIGINS` |
| Headers | Helmet con defaults de seguridad |
| Input validation | express-validator en cada ruta |
| Path traversal | Bloqueo de `/`, `\`, `..`, null bytes en nombres de archivo |
| IDOR protection | Archivos prefijados con `userId_` — solo el dueno puede descargar |
| Secrets | Solo `config/index.js` lee `process.env` (Base 3) |
| Dependencias | Versiones exactas en package.json, npm audit en CI |

---

## Bases de desarrollo

El proyecto sigue 11 bases de desarrollo inmutables documentadas en `CLAUDE.md`. Referencia rapida:

1. Arquitectura por capas
2. Errores centralizados (AppError)
3. Secrets externalizados
4. Validacion en la frontera
5. Migraciones versionadas
6. Codigo legible por IA (max 150 lineas/archivo)
7. Contratos explicitos (JSDoc)
8. Run & See inmediato (Docker)
9. Auth y tokens seguros
10. Sin CVEs conocidos
11. Estilo consistente (ESLint + Prettier + Husky)

Ver `CLAUDE.md` para la documentacion completa de cada base.
