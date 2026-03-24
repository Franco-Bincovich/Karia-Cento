// tools/excelComparacion.js
// Generación de Excel pivoteado de comparación de precios por tienda.

const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'excelComparacion' });
const { TMP_DIR } = require('../utils/paths');

// Colores de marca KarIA
const COLOR_HEADER_BG = 'FF081C54'; // #081c54 — azul oscuro
const COLOR_MIN_BG = 'FF43D1C9'; // #43d1c9 — verde KarIA (precio más bajo)
const ANCHO_PRODUCTO = 40;
const ANCHO_TIENDA = 18;

/** Formatea un número como precio argentino: $89.999 */
function formatearPrecio(precio) {
  return '$' + Math.round(precio).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Pivotea el array de resultados de buscarPrecios() a { tiendas, productos }.
 * Agrupa por nombre normalizado; si la misma tienda repite producto, conserva el menor precio.
 *
 * @param {Object[]} resultados - array de { tienda, nombre, precio, ... }
 * @returns {{ tiendas: string[], productos: { nombre: string, precios: Object }[] }}
 */
function pivotear(resultados) {
  const tiendas = [...new Set(resultados.map((r) => r.tienda))];
  const productosMap = new Map();

  resultados.forEach((r) => {
    const key = r.nombre.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!productosMap.has(key)) {
      productosMap.set(key, { nombre: r.nombre, precios: {} });
    }
    const entrada = productosMap.get(key);
    if (entrada.precios[r.tienda] === undefined || r.precio < entrada.precios[r.tienda]) {
      entrada.precios[r.tienda] = r.precio;
    }
  });

  return { tiendas, productos: [...productosMap.values()] };
}

/**
 * Genera un Excel pivoteado de comparación de precios por tienda.
 * Encabezado: Producto | Tienda1 | Tienda2 | ... (dinámico).
 * Cada fila = un producto; el precio mínimo de cada fila se resalta en verde KarIA.
 *
 * @param {{ nombreArchivo: string, userId: string, query: string, resultados: Object[] }} params
 * resultados es el array que devuelve buscarPrecios()
 * @returns {Promise<string>} ruta local del archivo generado en /tmp
 * @throws {AppError} code: 'EXCEL_ERROR'
 */
async function generarExcelComparacion({ nombreArchivo, userId, query, resultados }) {
  try {
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }

    const { tiendas, productos } = pivotear(resultados);
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

    // Encabezado: fondo azul oscuro, texto blanco negrita
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
      const soloPrecios = valores.filter((v) => v !== null);
      const min = soloPrecios.length > 0 ? Math.min(...soloPrecios) : null;

      const fila = [producto.nombre, ...valores.map((v) => (v !== null ? formatearPrecio(v) : '—'))];
      const row = worksheet.addRow(fila);
      row.getCell(1).alignment = { wrapText: true, vertical: 'top' };

      // Precio mínimo de la fila → fondo verde KarIA
      if (min !== null) {
        valores.forEach((v, idx) => {
          if (v === min) {
            const cell = row.getCell(idx + 2); // col 1 = Producto; tiendas desde col 2
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MIN_BG } };
            cell.font = { bold: true };
          }
        });
      }
    });

    const rutaArchivo = path.join(TMP_DIR, `${userId}_${nombreArchivo}.xlsx`);
    await workbook.xlsx.writeFile(rutaArchivo);

    logger.info('Excel comparación generado', {
      rutaArchivo,
      query,
      productos: productos.length,
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
