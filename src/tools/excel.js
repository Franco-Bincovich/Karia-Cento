// tools/excel.js
// Generación de archivos Excel (.xlsx) usando ExcelJS.

const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'excel' });
const { TMP_DIR } = require('../utils/paths');

/**
 * Genera un archivo Excel (.xlsx) a partir de datos tabulares.
 *
 * @param {{ nombreArchivo: string, userId: string, hoja?: string, columnas: string[], filas: any[][] }} params
 * @returns {Promise<string>} ruta local del archivo generado en /tmp
 * @throws {AppError} code: 'EXCEL_ERROR'
 */
async function generarExcel({ nombreArchivo, userId, hoja = 'Datos', columnas, filas }) {
  try {
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(hoja);

    worksheet.columns = columnas.map((col) => ({
      header: col,
      key: col,
      width: Math.max(col.length + 4, 14),
    }));

    // Estilo de encabezado
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    });

    filas.forEach((fila) => worksheet.addRow(fila));

    const rutaArchivo = path.join(TMP_DIR, `${userId}_${nombreArchivo}.xlsx`);
    await workbook.xlsx.writeFile(rutaArchivo);

    logger.info('Excel generado', { rutaArchivo, filas: filas.length });
    return rutaArchivo;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error al generar Excel', { error: err.message });
    throw new AppError(`Error al generar Excel: ${err.message}`, 'EXCEL_ERROR', 500);
  }
}

module.exports = { generarExcel };
