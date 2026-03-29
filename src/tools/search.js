// tools/search.js
// Búsqueda de precios en tiendas de electrodomésticos de Argentina.
// ETAPA 1: búsqueda general → ETAPA 2: búsqueda cruzada por producto → ETAPA 3: unificación.

const { buscarEnVTEX, TIENDAS_VTEX } = require('./scrapers/vtex');
const { buscarEnCetrogar } = require('./scrapers/cetrogar');
const { buscarEnMercadoLibre } = require('./scrapers/mercadolibre');
const { buscarConWebSearch } = require('./scrapers/webSearch');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'search' });

const MAX_PRODUCTOS_CRUZADOS = 10;
const DELAY_SECUENCIAL_MS = 1000;

const MARCAS = [
  'samsung',
  'philips',
  'hisense',
  'noblex',
  'philco',
  'hitachi',
  'sanyo',
  'kodak',
  'motorola',
  'skyworth',
  'top house',
  'whirlpool',
  'drean',
  'electrolux',
  'midea',
  'patrick',
  'columbia',
  'candy',
  'liliana',
  'peabody',
  'sony',
  'gafa',
  'atma',
  'tcl',
  'bgh',
  'rca',
];
const RE_LG = /\blg\b/i;
const RE_PULGADAS = /\b(\d{2})\s*(?:"|''|\u201d|pulgadas?|pulg)\b/i;
const RE_PULGADAS_FLEX = /\b(24|32|40|42|43|50|55|58|60|65|70|75|77|85|86)\b/;

/**
 * Normaliza un string: minúsculas sin tildes.
 *
 * @param {string} s
 * @returns {string}
 */
function normalizar(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Detecta marca en un texto.
 *
 * @param {string} texto
 * @returns {string} marca en minúsculas o ''
 */
function detectarMarca(texto) {
  if (RE_LG.test(texto)) return 'lg';
  const lower = texto.toLowerCase();
  return MARCAS.find((m) => lower.includes(m)) || '';
}

/**
 * Detecta pulgadas en un texto.
 *
 * @param {string} texto
 * @returns {string} pulgadas o ''
 */
function detectarPulgadas(texto) {
  const match = texto.match(RE_PULGADAS) || texto.match(RE_PULGADAS_FLEX);
  return match ? match[1] : '';
}

/**
 * Filtra productos para búsqueda cruzada según la query original.
 * Solo pasan productos relevantes: misma marca, mismas pulgadas, precio > 0,
 * y al menos una palabra clave de la query en el nombre.
 *
 * @param {string[]} nombres - Nombres de productos candidatos
 * @param {string} query - Query original del usuario
 * @returns {string[]} nombres filtrados
 */
function filtrarParaCruce(nombres, query) {
  const marcaQuery = detectarMarca(query);
  const pulgQuery = detectarPulgadas(query);
  const palabrasQuery = normalizar(query)
    .split(/\s+/)
    .filter((p) => p.length >= 3);

  return nombres.filter((nombre) => {
    const lower = normalizar(nombre);

    if (marcaQuery && detectarMarca(nombre) !== marcaQuery) return false;
    if (pulgQuery && detectarPulgadas(nombre) !== pulgQuery) return false;
    if (palabrasQuery.length > 0 && !palabrasQuery.some((p) => lower.includes(p))) return false;

    return true;
  });
}

const RE_MODELO = /\b([A-Z]{2}\d{2}[A-Z0-9]{4,})\b/i;
const RE_SUFIJO_PAIS = /(?:GCZB|AGCZB|BAGCZB|PSA|APA|AG|GC|CL)$/i;
const PALABRAS_COMUNES = new Set([
  'smart',
  'tv',
  'televisor',
  'pulgadas',
  'pulg',
  'samsung',
  'philips',
  'hisense',
  'noblex',
  'philco',
  'hitachi',
  'kodak',
  'motorola',
  'skyworth',
  'sony',
  'tcl',
  'bgh',
  'rca',
  'whirlpool',
  'electrolux',
  'crystal',
  'uhd',
  'qled',
  'oled',
  'nanocell',
  'neo',
  'led',
  'full',
  'tizen',
  'google',
  'android',
  'webos',
  'gaming',
  'ultra',
  'pantalla',
  'monitor',
  'negro',
  'blanco',
  'gris',
  'silver',
]);

/** Detecta un modelo informal: palabra alfanumérica con al menos un dígito, no común. */
const RE_INFORMAL = /\b([A-Za-z]+\d[A-Za-z0-9]*|\d+[A-Za-z][A-Za-z0-9]*)\b/g;

/**
 * Extrae la mejor query para buscar un producto en tiendas VTEX.
 * Prioridad: código formal > modelo informal > marca + pulgadas.
 *
 * @param {string} nombre - Nombre del producto
 * @returns {string} query para VTEX
 */
function queryVTEX(nombre) {
  // 1. Código formal (2 letras + 2 dígitos + 4+ alfanum) → solo el código
  const formal = nombre.match(RE_MODELO);
  if (formal) return formal[1].toUpperCase().replace(RE_SUFIJO_PAIS, '');

  // 2. Modelo informal (alfanum con dígitos, no común) → pulgadas + modelo
  const matches = [...nombre.matchAll(RE_INFORMAL)];
  const informal = matches.find((m) => {
    const low = m[1].toLowerCase();
    return low.length >= 4 && !PALABRAS_COMUNES.has(low);
  });
  if (informal) {
    const pulg = detectarPulgadas(nombre);
    return pulg ? `${pulg} ${informal[1]}` : informal[1];
  }

  // 3. Marca + pulgadas como mínimo
  const marca = detectarMarca(nombre);
  const pulg = detectarPulgadas(nombre);
  if (marca && pulg) return `${marca} ${pulg}`;

  return nombre.split(/\s+/).slice(0, 3).join(' ');
}

/**
 * Genera la query óptima para buscar un producto en otra tienda.
 * VTEX/MeLi: código de modelo o modelo informal. Cetrogar/webSearch: nombre completo.
 *
 * @param {string} nombre - Nombre original del producto
 * @param {string} tienda - Tienda destino
 * @returns {string} query a usar
 */
function queryParaCruce(nombre, tienda) {
  if (TIENDAS_VTEX[tienda] || tienda === 'mercadolibre') {
    return queryVTEX(nombre);
  }
  return nombre;
}

/** Pausa por ms milisegundos. */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Tiendas con scraper dedicado (no VTEX). */
const TIENDAS_DEDICADAS = new Set(['cetrogar', 'megatone', 'mercadolibre']);

/** Todas las tiendas soportadas. */
const TODAS_LAS_TIENDAS = [...Object.keys(TIENDAS_VTEX), ...TIENDAS_DEDICADAS];

/**
 * Detecta qué tiendas menciona el usuario en un mensaje.
 *
 * @param {string} mensaje
 * @returns {string[]} array de nombres canónicos de tiendas detectadas
 */
function detectarTiendas(mensaje) {
  const lower = normalizar(mensaje);
  return TODAS_LAS_TIENDAS.filter((t) => lower.includes(t));
}

/**
 * Busca un producto en una tienda específica.
 *
 * @param {string} query - Término de búsqueda
 * @param {string} tienda - Nombre canónico de la tienda
 * @returns {Promise<Object[]>} resultados de { nombre, precio, ... }
 */
async function buscarEnTienda(query, tienda) {
  try {
    if (TIENDAS_VTEX[tienda]) {
      return await buscarEnVTEX(tienda, TIENDAS_VTEX[tienda], query);
    }
    if (tienda === 'cetrogar') {
      return await buscarEnCetrogar(query);
    }
    if (tienda === 'mercadolibre') {
      return await buscarEnMercadoLibre(query, 20);
    }
    return await buscarConWebSearch(query, tienda);
  } catch {
    return [];
  }
}

/**
 * Busca precios de un producto en las tiendas solicitadas.
 * ETAPA 1: búsqueda general en todas las tiendas en paralelo.
 * ETAPA 2: búsqueda cruzada — cada producto se busca en las tiendas donde no apareció.
 * ETAPA 3: unificación — resultado final con precios por tienda por producto.
 *
 * @param {{ query: string, tiendas?: string[] }} params
 * @returns {Promise<Object[]>} array de { nombre, precios: { tienda: number|null, ... } }
 * @throws {AppError} code: 'SEARCH_ERROR'
 */
async function buscarPrecios({ query, tiendas = [] }) {
  const tiendasActivas =
    tiendas.length > 0
      ? tiendas.map(normalizar).filter((t) => TODAS_LAS_TIENDAS.includes(t))
      : [...TODAS_LAS_TIENDAS];

  try {
    // ── ETAPA 1 — búsqueda general en paralelo ─────────────────────────────
    const promesasEtapa1 = tiendasActivas.map((tienda) =>
      buscarEnTienda(query, tienda).then((r) => ({ tienda, resultados: r }))
    );
    const settled = await Promise.allSettled(promesasEtapa1);

    // Recopilar resultados planos: { tienda, nombre, precio, ... }
    const resultadosPlanos = [];
    settled.forEach((outcome) => {
      if (outcome.status === 'fulfilled') {
        const { tienda, resultados: r } = outcome.value;
        r.forEach((item) => resultadosPlanos.push({ tienda, ...item }));
      }
    });

    logger.info('ETAPA 1 completada', { query, productos: resultadosPlanos.length });

    // ── ETAPA 2 — búsqueda cruzada por producto ────────────────────────────
    // Agrupar por nombre de producto → en qué tiendas ya apareció
    const productosTiendas = new Map();
    resultadosPlanos.forEach((r) => {
      if (r.precio <= 0) return;
      if (!productosTiendas.has(r.nombre)) {
        productosTiendas.set(r.nombre, { precio: {} });
      }
      const entry = productosTiendas.get(r.nombre);
      if (entry.precio[r.tienda] === undefined || r.precio < entry.precio[r.tienda]) {
        entry.precio[r.tienda] = r.precio;
      }
    });

    // Filtrar productos relevantes para búsqueda cruzada
    const todosNombres = [...productosTiendas.keys()];
    const nombresRelevantes = filtrarParaCruce(todosNombres, query);
    const productosParaCruzar = nombresRelevantes
      .filter((n) => Object.keys(productosTiendas.get(n).precio).length < tiendasActivas.length)
      .slice(0, MAX_PRODUCTOS_CRUZADOS);

    if (productosParaCruzar.length > 0) {
      // Separar búsquedas: paralelas (VTEX) y secuenciales (Cetrogar — evitar rate limit)
      const busquedasParalelas = [];
      const busquedasSecuenciales = [];

      productosParaCruzar.forEach((nombre) => {
        const data = productosTiendas.get(nombre);
        const tiendasFaltantes = tiendasActivas.filter((t) => data.precio[t] === undefined);
        tiendasFaltantes.forEach((tienda) => {
          const tarea = { nombre, tienda };
          if (tienda === 'cetrogar') {
            busquedasSecuenciales.push(tarea);
          } else {
            busquedasParalelas.push(tarea);
          }
        });
      });

      logger.info('ETAPA 2 búsqueda cruzada', {
        productos: productosParaCruzar.length,
        paralelas: busquedasParalelas.length,
        secuenciales: busquedasSecuenciales.length,
      });

      // Ejecutar búsquedas paralelas (VTEX, MeLi, webSearch) — usar código de modelo
      const promesasParalelas = busquedasParalelas.map((t) =>
        buscarEnTienda(queryParaCruce(t.nombre, t.tienda), t.tienda).then((r) => ({
          ...t,
          resultados: r,
        }))
      );
      const paraleloSettled = await Promise.allSettled(promesasParalelas);
      paraleloSettled.forEach((outcome) => {
        if (outcome.status !== 'fulfilled') return;
        const { nombre, tienda, resultados } = outcome.value;
        if (resultados.length === 0) return;
        const mejor = resultados.reduce((a, b) => (a.precio <= b.precio ? a : b));
        const entry = productosTiendas.get(nombre);
        if (entry && entry.precio[tienda] === undefined) {
          entry.precio[tienda] = mejor.precio;
        }
      });

      // Ejecutar búsquedas secuenciales (Cetrogar — 1s delay entre cada una)
      for (let i = 0; i < busquedasSecuenciales.length; i++) {
        if (i > 0) await delay(DELAY_SECUENCIAL_MS); // eslint-disable-line no-await-in-loop
        const { nombre, tienda } = busquedasSecuenciales[i];
        try {
          const resultados = await buscarEnTienda(queryParaCruce(nombre, tienda), tienda); // eslint-disable-line no-await-in-loop
          if (resultados.length === 0) continue;
          const mejor = resultados.reduce((a, b) => (a.precio <= b.precio ? a : b));
          const entry = productosTiendas.get(nombre);
          if (entry && entry.precio[tienda] === undefined) {
            entry.precio[tienda] = mejor.precio;
          }
        } catch {
          logger.warn('Búsqueda secuencial falló', { nombre, tienda });
        }
      }
    }

    // ── ETAPA 3 — construir resultado unificado ─────────────────────────────
    const resultadoUnificado = [];
    productosTiendas.forEach((data, nombre) => {
      const precios = {};
      tiendasActivas.forEach((t) => {
        precios[t] = data.precio[t] ?? null;
      });

      // Filtrar productos sin precio en ninguna tienda
      const tieneAlgunPrecio = Object.values(precios).some((p) => p !== null && p > 0);
      if (tieneAlgunPrecio) {
        resultadoUnificado.push({ nombre, precios });
      }
    });

    logger.info('Búsqueda de precios completada', {
      query,
      tiendas: tiendasActivas,
      productos: resultadoUnificado.length,
    });
    return resultadoUnificado;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en buscarPrecios', { error: err.message, query });
    throw new AppError(`Error al buscar precios: ${err.message}`, 'SEARCH_ERROR', 500);
  }
}

module.exports = { buscarPrecios, detectarTiendas };
