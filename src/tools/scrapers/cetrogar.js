// tools/scrapers/cetrogar.js
// Scraper dedicado para Cetrogar (Magento).
// Intenta catalogsearch HTML (más resultados) y luego suggest AJAX como fallback.

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../../config');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'scraper.cetrogar' });

const client = new Anthropic({ apiKey: config.anthropic.apiKey });
const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search', max_uses: 3 };

const TIMEOUT_MS = 8000;
const BASE = 'https://www.cetrogar.com.ar';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html, application/json, */*',
  'Accept-Language': 'es-AR,es;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
  Referer: `${BASE}/`,
  Origin: BASE,
};

/**
 * Extrae el precio numérico del HTML de precio que devuelve Magento.
 * Busca data-price-amount="NNN".
 *
 * @param {string} priceHtml - HTML del campo price
 * @returns {{ precio: number|null, precioAnterior: number|null }}
 */
function extraerPrecio(priceHtml) {
  if (!priceHtml) return { precio: null, precioAnterior: null };

  const precios = [...priceHtml.matchAll(/data-price-amount="([\d.]+)"/g)].map((m) => Number(m[1]));
  if (precios.length === 0) return { precio: null, precioAnterior: null };

  const precio = Math.min(...precios);
  const precioAnterior = precios.length > 1 ? Math.max(...precios) : null;
  return { precio, precioAnterior: precioAnterior !== precio ? precioAnterior : null };
}

/**
 * Extrae productos del HTML de búsqueda de Cetrogar (catalogsearch).
 * Parsea bloques product-item-info del HTML renderizado server-side.
 *
 * @param {string} html - HTML completo de la página de resultados
 * @returns {Object[]} array de { nombre, precio, precioAnterior, url, disponible }
 */
function parsearCatalogHTML(html) {
  const bloques = [
    ...html.matchAll(/<li[^>]*class="[^"]*product-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi),
  ];
  return bloques
    .map((m) => {
      const bloque = m[1];
      const nombreMatch = bloque.match(/class="product-item-link"[^>]*>\s*([^<]+)/);
      const urlMatch = bloque.match(/href="(https:\/\/www\.cetrogar\.com\.ar\/[^"]+)"/);
      const precioMatch = bloque.match(/data-price-amount="([\d.]+)"/g);
      const precios = precioMatch ? precioMatch.map((p) => Number(p.match(/([\d.]+)/)[1])) : [];

      if (!nombreMatch || precios.length === 0) return null;

      const precio = Math.min(...precios);
      const precioAnterior = precios.length > 1 ? Math.max(...precios) : null;
      return {
        nombre: nombreMatch[1].trim(),
        precio,
        precioAnterior: precioAnterior !== precio ? precioAnterior : null,
        url: urlMatch ? urlMatch[1] : '',
        disponible: true,
      };
    })
    .filter((r) => r !== null && r.precio > 0);
}

/**
 * Intenta obtener resultados del catalogsearch HTML de Cetrogar.
 *
 * @param {string} query - Término de búsqueda
 * @param {AbortSignal} signal - Signal del AbortController
 * @returns {Promise<Object[]>}
 */
async function buscarCatalogSearch(query, signal) {
  const url = `${BASE}/catalogsearch/result/index/?q=${encodeURIComponent(query)}&product_list_limit=20`;
  const res = await fetch(url, {
    signal,
    headers: { ...HEADERS, Accept: 'text/html' },
  });

  if (!res.ok) return [];

  const html = await res.text();
  return parsearCatalogHTML(html);
}

/**
 * Intenta obtener resultados del endpoint AJAX suggest de Cetrogar.
 *
 * @param {string} query - Término de búsqueda
 * @param {AbortSignal} signal - Signal del AbortController
 * @returns {Promise<Object[]>}
 */
async function buscarSuggest(query, signal) {
  const url = `${BASE}/search/ajax/suggest/?q=${encodeURIComponent(query)}&_=${Date.now()}`;
  const res = await fetch(url, { signal, headers: HEADERS });

  if (!res.ok) return [];

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data
    .filter((item) => item.type === 'product')
    .map((item) => {
      const { precio, precioAnterior } = extraerPrecio(item.price);
      return {
        nombre: item.title || '',
        precio,
        precioAnterior,
        url: item.url || '',
        disponible: true,
      };
    })
    .filter((r) => r.precio !== null && r.precio > 0);
}

/**
 * Fallback: busca productos en Cetrogar usando web_search cuando suggest devuelve 0.
 *
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Object[]>} array de { nombre, precio, precioAnterior, url, disponible }
 */
async function buscarConWebSearch(query) {
  const prompt =
    `Buscá '${query} site:cetrogar.com.ar' usando web_search. ` +
    'De los resultados encontrados en cetrogar.com.ar, extraé productos con nombre y precio en pesos argentinos. ' +
    'Devolvé SOLO un JSON array con este formato exacto, sin texto adicional: ' +
    '[{"nombre": "string", "precio": number, "url": "string"}] ' +
    'Solo productos de cetrogar.com.ar. Solo precios mayores a 0. Si no encontrás nada devolvé [].';

  try {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 1024,
      tools: [WEB_SEARCH_TOOL],
      messages: [{ role: 'user', content: prompt }],
    });

    const texto = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const match = texto.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    const data = JSON.parse(match[0]);
    if (!Array.isArray(data)) return [];

    const resultados = data
      .filter((item) => item && typeof item.precio === 'number' && item.precio > 0)
      .map((item) => ({
        nombre: item.nombre || '',
        precio: item.precio,
        precioAnterior: null,
        url: item.url || '',
        disponible: true,
      }));

    logger.info('Cetrogar web_search OK', { query, resultados: resultados.length });
    return resultados;
  } catch (err) {
    logger.warn('Cetrogar web_search error', { query, error: err.message });
    return [];
  }
}

/**
 * Busca productos en Cetrogar. Intenta catalogsearch HTML primero,
 * luego suggest AJAX, luego web_search como último fallback.
 *
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Object[]>} array de { nombre, precio, precioAnterior, url, disponible }
 * @throws {AppError} code: 'CETROGAR_SCRAPER_ERROR'
 */
async function buscarEnCetrogar(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let resultados = await buscarCatalogSearch(query, controller.signal);

    if (resultados.length === 0) {
      logger.info('Cetrogar catalogsearch vacío, probando suggest', { query });
      resultados = await buscarSuggest(query, controller.signal);
    }

    clearTimeout(timeout);

    if (resultados.length === 0) {
      logger.info('Cetrogar suggest vacío, probando web_search', { query });
      resultados = await buscarConWebSearch(query);
    }

    logger.info('Cetrogar scraper OK', { query, resultados: resultados.length });
    return resultados;
  } catch (err) {
    clearTimeout(timeout);
    if (err.isOperational) throw err;
    logger.warn('Cetrogar scraper error', { query, error: err.message });
    throw new AppError(`Error Cetrogar: ${err.message}`, 'CETROGAR_SCRAPER_ERROR', 500);
  }
}

module.exports = { buscarEnCetrogar };
