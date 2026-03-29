// tools/scrapers/webSearch.js
// Sub-agente especialista en búsqueda de precios usando web_search_20250305.
// Hace dos búsquedas en paralelo por tienda y combina resultados.

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
  const matchArray = texto.match(/\[[\s\S]*?\]/);
  if (matchArray) {
    try {
      return JSON.parse(matchArray[0]);
    } catch {
      /* continúa */
    }
  }
  const matchObj = texto.match(/\{[\s\S]*?\}/);
  if (matchObj) {
    try {
      return JSON.parse(matchObj[0]);
    } catch {
      /* continúa */
    }
  }
  return null;
}

/**
 * Normaliza los datos extraídos al formato estándar del agente.
 * Filtra resultados con precio nulo, undefined o <= 0.
 *
 * @param {Object|Object[]} data
 * @returns {Object[]} array de { nombre, precio, precioAnterior, url, disponible }
 */
function normalizarResultados(data) {
  const items = Array.isArray(data) ? data : [data];
  return items
    .filter((item) => item && typeof item.precio === 'number' && item.precio > 0)
    .map((item) => ({
      nombre: item.nombre || '',
      precio: Number(item.precio),
      precioAnterior: item.precioAnterior ?? null,
      url: item.url || '',
      disponible: item.disponible ?? true,
    }));
}

/**
 * Ejecuta una búsqueda web con un prompt específico.
 *
 * @param {string} prompt - Prompt para el sub-agente
 * @returns {Promise<Object[]>} resultados normalizados
 */
async function ejecutarBusqueda(prompt) {
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
  return normalizarResultados(data);
}

/**
 * Usa un sub-agente Claude con web_search para buscar el precio de un producto en una tienda.
 * Hace dos búsquedas en paralelo (site: y genérica) y combina resultados deduplicados.
 *
 * @param {string} query  - Nombre del producto
 * @param {string} tienda - Nombre de la tienda (ej: 'cetrogar')
 * @returns {Promise<Object[]>} array de { nombre, precio, precioAnterior, url, disponible }
 */
/** Dominios por tienda para construir búsquedas site: */
const DOMINIOS = {
  megatone: 'megatone.net',
  cetrogar: 'cetrogar.com.ar',
};

async function buscarConWebSearch(query, tienda) {
  const anio = new Date().getFullYear();
  const dominio = DOMINIOS[tienda] || `${tienda}.com.ar`;

  const esMegatone = tienda === 'megatone';
  const promptBase = esMegatone
    ? `Usá web_search para buscar '${query} megatone.net precio'. ` +
      'Buscá en los resultados precios actuales de Megatone Argentina. ' +
      'Extraé productos con nombre, precio numérico en pesos argentinos y URL. ' +
      'Devolvé SOLO un JSON array: ' +
      '[{"nombre": "string", "precio": number, "precioAnterior": null, "url": "string", "disponible": true}] ' +
      'Solo incluí productos con precio > 0. Si no encontrás nada devolvé [].'
    : `Usá web_search para buscar '${query}' en ${dominio}. ` +
      'Buscá específicamente productos que coincidan con la búsqueda. ' +
      'Extraé TODOS los productos encontrados y devolvé SOLO un JSON array con este formato exacto: ' +
      '[{"nombre": "string", "precio": number, "precioAnterior": null, "url": "string", "disponible": true}] ' +
      'Solo incluí productos con precio mayor a 0. Si no encontrás nada devolvé [].';

  const promptSite = `${promptBase} Buscá: ${query} site:${dominio}`;
  const promptGenerico = `${promptBase} Buscá: ${query} precio ${tienda} Argentina ${anio}`;

  try {
    const [r1, r2] = await Promise.allSettled([
      ejecutarBusqueda(promptSite),
      ejecutarBusqueda(promptGenerico),
    ]);

    const resultados1 = r1.status === 'fulfilled' ? r1.value : [];
    const resultados2 = r2.status === 'fulfilled' ? r2.value : [];

    // Deduplicar por URL
    const vistos = new Set();
    const combinados = [...resultados1, ...resultados2].filter((r) => {
      if (!r.url || vistos.has(r.url)) return false;
      vistos.add(r.url);
      return true;
    });

    logger.info('web_search encontró resultados', { tienda, query, cantidad: combinados.length });
    return combinados;
  } catch (err) {
    logger.warn('web_search sub-agente error', { tienda, query, error: err.message });
    return [];
  }
}

module.exports = { buscarConWebSearch };
