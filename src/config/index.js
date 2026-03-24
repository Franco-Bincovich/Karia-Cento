// config/index.js
// Único archivo del proyecto que lee process.env.
// Todos los demás módulos importan desde acá.

require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'],

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '8h',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-haiku-4-5',
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },

  google: {
    cuenta1: {
      clientId: process.env.GOOGLE_CLIENT_ID_1,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_1,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN_1,
    },
    cuenta2: {
      clientId: process.env.GOOGLE_CLIENT_ID_2,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_2,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN_2,
    },
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },

  gamma: {
    apiKey: process.env.GAMMA_API_KEY,
  },

  rateLimit: {
    login: { windowMs: 15 * 60 * 1000, max: 10 },
    api: { windowMs: 15 * 60 * 1000, max: 100 },
    chat: { windowMs: 60 * 1000, max: 20 },
  },
};

function validarConfig() {
  const config = module.exports;
  const requeridas = [
    { clave: 'jwt.secret', valor: config.jwt.secret },
    { clave: 'anthropic.apiKey', valor: config.anthropic.apiKey },
    { clave: 'supabase.url', valor: config.supabase.url },
    { clave: 'supabase.key', valor: config.supabase.key },
  ];

  const faltantes = requeridas.filter((v) => !v.valor).map((v) => v.clave);

  if (faltantes.length > 0) {
    throw new Error(
      `[Config] Variables de entorno críticas faltantes: ${faltantes.join(', ')}. ` +
        'Revisá tu archivo .env (ver .env.example).'
    );
  }
}

validarConfig();
