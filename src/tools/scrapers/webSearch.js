// tools/scrapers/webSearch.js
// Sub-agente especialista en búsqueda de precios usando web_search_20250305.
// La tool es server-side: una sola llamada retorna end_turn con los resultados integrados.

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../../config');
const logger = require('../../utils/logger').child({ module: 'scraper.webSearch' });

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search', max_uses: 3 };

/**
 * Extrae el primer array o objeto JSON válido de un texto.
 *
 * @param {string} texto
 * @returns {Object|Object[]|null}
 */
function extraerJSON(texto) {
  // Buscar array primero, luego objeto
  const matchArray = texto.match(/\[[\s\S]*?\]/);
  if (matchArray) {
    try {
      return JSON.parse(matchArray[0]);
    } catch { /* continúa */ }
  }
  const matchObj = texto.match(/\{[\s\S]*?\}/);
  if (matchObj) {
    try {
      return JSON.parse(matchObj[0]);
    } catch { /* continúa */ }
  }
  return null;
}

/**
 * Normaliza los datos extraídos al formato estándar del agente.
 *
 * @param {Object|Object[]} data
 * @returns {Object[]} array de { nombre, precio, precioAnterior, url, disponible }
 */
function normalizarResultados(data) {
  const items = Array.isArray(data) ? data : [data];
  return items
    .filter((item) => item && item.precio !== null && item.precio !== undefined)
    .map((item) => ({
      nombre: item.nombre || '',
      precio: Number(item.precio),
      precioAnterior: null,
      url: item.url || '',
      disponible: item.disponible ?? true,
    }));
}

/**
 * Usa un sub-agente Claude con web_search para buscar el precio de un producto en una tienda.
 * Se llama como fallback cuando el scraper VTEX no retorna resultados.
 *
 * @param {string} query  - Nombre del producto
 * @param {string} tienda - Nombre de la tienda (ej: 'cetrogar')
 * @returns {Promise<Object[]>} array de { nombre, precio, precioAnterior, url, disponible }
 */
async function buscarConWebSearch(query, tienda) {
  const anioActual = new Date().getFullYear();
  const prompt =
    `Usá web_search para buscar: ${query} ${tienda} precio ${anioActual}. ` +
    `Retorná SOLO un JSON array con los resultados encontrados. Cada elemento debe tener: ` +
    `nombre, precio (número sin símbolos), moneda, url directa al producto, disponible (boolean). ` +
    `Si no encontrás resultados, retorná null.`;

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

    const data = extraerJSON(texto);
    if (!data) return [];

    const resultados = normalizarResultados(data);
    logger.info('web_search encontró resultados', { tienda, query, cantidad: resultados.length });
    return resultados;
  } catch (err) {
    logger.warn('web_search sub-agente error', { tienda, query, error: err.message });
    return [];
  }
}

module.exports = { buscarConWebSearch };
