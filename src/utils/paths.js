// utils/paths.js
// Constantes de rutas del sistema compartidas entre todos los módulos.
// Fuente única de verdad para TMP_DIR.

const path = require('path');

const TMP_DIR = path.join(process.cwd(), 'tmp');

module.exports = { TMP_DIR };
