// tools/scrapers/vtex.js
// Función genérica de scraping para tiendas VTEX argentinas.
// Flujo: POST /api/sessions → cookies → GET /api/catalog_system/pub/products/search.

const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'scraper.vtex' });

const TIMEOUT_COOKIE_MS = 6000;
const TIMEOUT_SEARCH_MS = 6000;

/** URLs base por tienda VTEX verificada. */
const TIENDAS_VTEX = {
  naldo: 'https://www.naldo.com.ar',
  oncity: 'https://www.oncity.com',
  fravega: 'https://www.fravega.com',
  musimundo: 'https://www.musimundo.com',
};

/**
 * Parsea un producto VTEX al formato estándar del agente.
 *
 * @param {Object} p - Producto del response VTEX
 * @returns {{ nombre: string, precio: number|null, precioAnterior: number|null, url: string, disponible: boolean }}
 */
function parsearProducto(p) {
  const offer = p.items?.[0]?.sellers?.[0]?.commertialOffer;
  return {
    nombre: p.productName,
    precio: offer?.Price ?? null,
    precioAnterior: offer?.ListPrice ?? null,
    url: p.link || '',
    disponible: (offer?.AvailableQuantity ?? 0) > 0,
  };
}

/**
 * Obtiene cookies de sesión VTEX (vtex_session, vtex_segment) via POST /api/sessions.
 *
 * @param {string} baseUrl - URL base de la tienda (ej: https://www.naldo.com.ar)
 * @returns {Promise<string>} string de cookies para el header Cookie
 */
async function obtenerCookies(baseUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_COOKIE_MS);

  try {
    const res = await fetch(`${baseUrl}/api/sessions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    clearTimeout(timeout);

    const setCookies = res.headers.getSetCookie?.() || [];
    return setCookies.map((c) => c.split(';')[0]).join('; ');
  } catch (err) {
    clearTimeout(timeout);
    logger.warn('No se pudieron obtener cookies VTEX', { baseUrl, error: err.message });
    return '';
  }
}

/**
 * Busca productos en cualquier tienda VTEX argentina.
 * Primero obtiene cookies de sesión y luego hace la búsqueda.
 *
 * @param {string} nombre  - Nombre canónico de la tienda (ej: 'naldo')
 * @param {string} baseUrl - URL base de la tienda (ej: https://www.naldo.com.ar)
 * @param {string} query   - Término de búsqueda
 * @returns {Promise<Object[]>} array de { nombre, precio, precioAnterior, url, disponible }
 * @throws {AppError} code: 'VTEX_SCRAPER_ERROR'
 */
async function buscarEnVTEX(nombre, baseUrl, query) {
  const cookies = await obtenerCookies(baseUrl);
  const searchUrl = `${baseUrl}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=19`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_SEARCH_MS);

  try {
    const headers = { Accept: 'application/json' };
    if (cookies) headers.Cookie = cookies;

    const res = await fetch(searchUrl, { signal: controller.signal, headers });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const productos = await res.json();
    if (!Array.isArray(productos)) throw new Error('Respuesta inesperada de VTEX');

    const resultados = productos.map(parsearProducto).filter((p) => p.precio !== null);
    logger.info('VTEX scraper OK', { nombre, query, resultados: resultados.length });
    return resultados;
  } catch (err) {
    clearTimeout(timeout);
    if (err.isOperational) throw err;
    logger.warn('VTEX scraper error', { nombre, query, error: err.message });
    throw new AppError(`Error VTEX (${nombre}): ${err.message}`, 'VTEX_SCRAPER_ERROR', 500);
  }
}

module.exports = { buscarEnVTEX, TIENDAS_VTEX };
