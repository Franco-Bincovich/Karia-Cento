// tools/export.js
// Generación de documentos Word (.docx) usando la librería docx.

const path = require('path');
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'export' });
const { TMP_DIR } = require('../utils/paths');

/**
 * Genera un documento Word (.docx).
 *
 * @param {{ nombreArchivo: string, userId: string, titulo: string, contenido: string }} params
 * @returns {Promise<string>} ruta local del archivo generado en /tmp
 * @throws {AppError} code: 'EXPORT_ERROR'
 */
async function generarWord({ nombreArchivo, userId, titulo, contenido }) {
  try {
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }

    const parrafos = contenido.split('\n').filter((l) => l.trim() !== '');

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: titulo,
              heading: HeadingLevel.HEADING_1,
            }),
            ...parrafos.map(
              (linea) =>
                new Paragraph({
                  children: [new TextRun({ text: linea, size: 24 })],
                  spacing: { after: 120 },
                })
            ),
          ],
        },
      ],
    });

    const rutaArchivo = path.join(TMP_DIR, `${userId}_${nombreArchivo}.docx`);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(rutaArchivo, buffer);

    logger.info('Word generado', { rutaArchivo });
    return rutaArchivo;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error al generar Word', { error: err.message });
    throw new AppError(`Error al generar Word: ${err.message}`, 'EXPORT_ERROR', 500);
  }
}

module.exports = { generarWord };
