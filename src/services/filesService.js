// services/filesService.js
// Lógica de negocio para descarga de archivos temporales generados por el agente.
// Solo permite archivos dentro de tmp/ — sin path traversal.

const fs = require('fs');
const path = require('path');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'filesService' });
const { TMP_DIR } = require('../utils/paths');

/** Extensiones permitidas para descarga. */
const EXTENSIONES_PERMITIDAS = new Set(['.xlsx', '.docx', '.pdf', '.csv']);

/**
 * Resuelve la ruta absoluta de un archivo en tmp/ y verifica su existencia.
 * Rechaza path traversal e intentos de acceder a archivos de otro usuario (IDOR).
 *
 * @param {string} nombreArchivo - Nombre del archivo (solo basename, sin /  ni ..)
 * @param {string} userId - ID del usuario autenticado; el archivo debe empezar con `${userId}_`
 * @returns {{ rutaAbsoluta: string, nombreArchivo: string, extension: string }}
 * @throws {AppError} FILE_NOT_FOUND (404) si el archivo no existe
 * @throws {AppError} FILE_TYPE_NOT_ALLOWED (400) si la extensión no está permitida
 * @throws {AppError} FORBIDDEN (403) si el archivo no pertenece al usuario
 */
function resolverArchivo(nombreArchivo, userId) {
  // Forzar solo el basename — elimina cualquier componente de directorio
  const baseName = path.basename(nombreArchivo);
  const rutaAbsoluta = path.join(TMP_DIR, baseName);

  // Verificar que la ruta resuelta siga dentro de TMP_DIR (doble seguridad)
  if (!rutaAbsoluta.startsWith(TMP_DIR + path.sep) && rutaAbsoluta !== TMP_DIR) {
    logger.warn('Intento de path traversal bloqueado', { nombreArchivo });
    throw new AppError('Nombre de archivo inválido', 'FILE_NOT_FOUND', 404);
  }

  // Verificar que el archivo pertenece al usuario (anti-IDOR)
  if (!baseName.startsWith(`${userId}_`)) {
    logger.warn('Intento de IDOR bloqueado', { userId, nombreArchivo });
    throw new AppError('Acceso denegado', 'FORBIDDEN', 403);
  }

  const extension = path.extname(baseName).toLowerCase();
  if (!EXTENSIONES_PERMITIDAS.has(extension)) {
    throw new AppError('Tipo de archivo no permitido', 'FILE_TYPE_NOT_ALLOWED', 400);
  }

  if (!fs.existsSync(rutaAbsoluta)) {
    throw new AppError(`Archivo no encontrado: ${baseName}`, 'FILE_NOT_FOUND', 404);
  }

  logger.info('Archivo resuelto para descarga', { baseName });
  return { rutaAbsoluta, nombreArchivo: baseName, extension };
}

module.exports = { resolverArchivo };
