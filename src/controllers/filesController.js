// controllers/filesController.js
// Orquesta la descarga de archivos generados por el agente.
// Sin lógica de negocio — delega en filesService.

const { resolverArchivo } = require('../services/filesService');
const logger = require('../utils/logger').child({ module: 'filesController' });

/** Tipos MIME por extensión. */
const MIME = {
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf':  'application/pdf',
  '.csv':  'text/csv',
};

/**
 * GET /api/files/download?file=nombre.xlsx
 * Requiere JWT válido (req.user adjuntado por verificarToken).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function descargarArchivo(req, res, next) {
  try {
    const { file } = req.query;
    const { rutaAbsoluta, nombreArchivo, extension } = resolverArchivo(file, req.user.userId);

    const contentType = MIME[extension] || 'application/octet-stream';

    logger.info('Enviando archivo', { userId: req.user?.userId, nombreArchivo });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.sendFile(rutaAbsoluta);
  } catch (err) {
    next(err);
  }
}

module.exports = { descargarArchivo };
