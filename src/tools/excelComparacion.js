// tools/excelComparacion.js
// Generación de Excel de comparación de precios por tienda.
// Recibe formato unificado: { nombre, precios: { tienda: number|null } }.

const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'excelComparacion' });
const { TMP_DIR } = require('../utils/paths');

const COLOR_HEADER_BG = 'FF081C54';
const COLOR_MIN_BG = 'FF43D1C9';
const COLOR_WHITE = 'FFFFFFFF';
const COLOR_NO_DISP = 'FFD9D9D9';
const ANCHO_PRODUCTO = 50;
const ANCHO_TIENDA = 18;

/** Formatea un número como precio argentino: $89.999 */
function formatearPrecio(precio) {
  return (
    '$' +
    Math.round(precio)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

/**
 * Genera un Excel de comparación de precios por tienda.
 * Una fila por producto, una columna por tienda.
 * Verde en el precio más bajo de cada fila (solo si hay 2+ precios).
 *
 * @param {{ nombreArchivo: string, userId: string, query: string, resultados: Object[] }} params
 * resultados: array de { nombre: string, precios: { tienda: number|null, ... } }
 * @returns {Promise<string>} ruta local del archivo generado en /tmp
 * @throws {AppError} code: 'EXCEL_ERROR'
 */
async function generarExcelComparacion({ nombreArchivo, userId, query, resultados }) {
  try {
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }

    // Filtrar productos sin precio en ninguna tienda
    const productos = resultados.filter((r) => {
      const precios = Object.values(r.precios);
      return precios.some((p) => p !== null && p > 0);
    });

    // Extraer tiendas de las columnas del primer producto
    const tiendas = productos.length > 0 ? Object.keys(productos[0].precios) : [];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Comparación ${query}`.substring(0, 31));

    worksheet.columns = [
      { header: 'Producto', key: 'producto', width: ANCHO_PRODUCTO },
      ...tiendas.map((t) => ({
        header: t.charAt(0).toUpperCase() + t.slice(1),
        key: t,
        width: ANCHO_TIENDA,
      })),
    ];

    // Encabezado
    const headerRow = worksheet.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Filas de datos
    productos.forEach((producto) => {
      const valores = tiendas.map((t) => producto.precios[t] ?? null);
      const soloPrecios = valores.filter((v) => v !== null && v > 0);
      const min = soloPrecios.length > 1 ? Math.min(...soloPrecios) : null;

      const celdas = [
        producto.nombre,
        ...valores.map((v) => (v !== null && v > 0 ? formatearPrecio(v) : 'No disponible')),
      ];
      const row = worksheet.addRow(celdas);
      row.getCell(1).alignment = { wrapText: true, vertical: 'top' };

      let verdeAsignado = false;
      valores.forEach((v, idx) => {
        const cell = row.getCell(idx + 2);

        if (v === null || v <= 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NO_DISP } };
          cell.font = { color: { argb: 'FF888888' }, italic: true };
        } else if (min !== null && v === min && !verdeAsignado) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MIN_BG } };
          cell.font = { bold: true };
          verdeAsignado = true;
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_WHITE } };
        }
      });
    });

    const rutaArchivo = path.join(TMP_DIR, `${userId}_${nombreArchivo}.xlsx`);
    await workbook.xlsx.writeFile(rutaArchivo);

    logger.info('Excel comparación generado', {
      rutaArchivo,
      query,
      filas: productos.length,
      tiendas: tiendas.length,
    });
    return rutaArchivo;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error al generar Excel comparación', { error: err.message });
    throw new AppError(`Error al generar Excel comparación: ${err.message}`, 'EXCEL_ERROR', 500);
  }
}

module.exports = { generarExcelComparacion };
