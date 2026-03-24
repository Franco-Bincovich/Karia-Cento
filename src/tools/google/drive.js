// tools/google/drive.js
// Herramientas de Google Drive para el agente Claude.

const fs = require('fs');
const { google } = require('googleapis');
const { getGoogleClient } = require('./auth');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'drive' });

/**
 * Sube un archivo local a Google Drive de la cuenta especificada.
 *
 * @param {{ numeroCuenta?: number, nombreArchivo: string, rutaLocal: string, mimeType: string }} params
 * @returns {Promise<{ id: string, webViewLink: string }>}
 * @throws {AppError} code: 'DRIVE_ERROR'
 */
async function subirArchivo({ numeroCuenta = 1, nombreArchivo, rutaLocal, mimeType }) {
  try {
    const auth = getGoogleClient(numeroCuenta);
    const drive = google.drive({ version: 'v3', auth });

    const respuesta = await drive.files.create({
      requestBody: { name: nombreArchivo },
      media: { mimeType, body: fs.createReadStream(rutaLocal) },
      fields: 'id, webViewLink',
    });

    logger.info('Archivo subido a Drive', { numeroCuenta, nombreArchivo, id: respuesta.data.id });
    return { id: respuesta.data.id, webViewLink: respuesta.data.webViewLink };
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en subirArchivo', { error: err.message });
    throw new AppError('Error al subir archivo a Drive', 'DRIVE_ERROR', 500);
  }
}

module.exports = { subirArchivo };
