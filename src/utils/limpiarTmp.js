// utils/limpiarTmp.js
// Limpieza periódica de archivos temporales en el directorio /tmp del proyecto.
// Elimina archivos con más de 1 hora de antigüedad.
// Se ejecuta automáticamente cada 30 minutos al requerir este módulo.

const fs = require('fs');
const path = require('path');
const logger = require('./logger').child({ module: 'limpiarTmp' });
const { TMP_DIR } = require('./paths');
const MAX_EDAD_MS = 60 * 60 * 1000;       // 1 hora
const INTERVALO_MS = 30 * 60 * 1000;      // 30 minutos

/**
 * Elimina archivos con más de MAX_EDAD_MS de antigüedad en TMP_DIR.
 * Si el directorio no existe, no hace nada.
 */
function limpiarTmp() {
  if (!fs.existsSync(TMP_DIR)) {
    return;
  }

  let archivos;
  try {
    archivos = fs.readdirSync(TMP_DIR);
  } catch (err) {
    logger.error('No se pudo leer el directorio tmp', { error: err.message });
    return;
  }

  const ahora = Date.now();
  let eliminados = 0;

  for (const archivo of archivos) {
    const rutaArchivo = path.join(TMP_DIR, archivo);
    try {
      const stat = fs.statSync(rutaArchivo);
      if (ahora - stat.mtimeMs > MAX_EDAD_MS) {
        fs.unlinkSync(rutaArchivo);
        eliminados++;
      }
    } catch (err) {
      logger.warn('No se pudo eliminar archivo tmp', { archivo, error: err.message });
    }
  }

  logger.info(`Limpieza tmp completada`, { eliminados, total: archivos.length });
}

setInterval(limpiarTmp, INTERVALO_MS);

module.exports = { limpiarTmp };
