// tools/google/auth.js
// Re-exporta getGoogleClient para uso dentro de las herramientas Google.
// Los demás módulos en tools/google/ importan desde acá, no desde integrations/ directamente.

const { getGoogleClient } = require('../../integrations/googleClient');

module.exports = { getGoogleClient };
