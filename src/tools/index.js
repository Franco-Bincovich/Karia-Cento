// tools/index.js
// Registro central de herramientas del agente KarIA Scout.
// TOOLS se pasa directamente a la API de Anthropic en agent.js.
// Las tools que llaman a APIs externas se protegen con circuit breaker + retry.

const { AppError } = require('../middleware/errorHandler');
const { TOOLS } = require('./toolDefinitions');
const { withCircuitBreaker } = require('../utils/circuitBreaker');
const { withRetry } = require('../utils/reintentos');

// ── Opciones de protección ────────────────────────────────────────────────────
const CB_OPTS = { maxFallos: 5, cooldownMs: 30000 };
const R2 = { maxIntentos: 2 }; // operaciones de escritura (envío de mail, crear evento)
const R3 = { maxIntentos: 3 }; // operaciones de lectura

/** Envuelve fn con retry + circuit breaker. Inicializado una sola vez al cargar el módulo. */
function proteger(fn, nombre, retryOpts) {
  return withCircuitBreaker(withRetry(fn, retryOpts), { nombre, ...CB_OPTS });
}

// ── Tools con APIs externas (circuit breaker + retry) ────────────────────────
const { buscarPrecios } = require('./search');
const { leerNoLeidos, buscarCorreos, enviarCorreo } = require('./google/gmail');
const { listarEventos, crearEvento, eliminarEvento } = require('./google/calendar');
const { subirArchivo } = require('./google/drive');
const { buscarContactos } = require('./google/contactos');
const { generarPresentacion } = require('./gamma');

const buscarPreciosSeguro = proteger(buscarPrecios, 'buscar_precios', R2);
const leerNoLeidosSeguro = proteger(leerNoLeidos, 'leer_correos', R3);
const buscarCorreosSeguro = proteger(buscarCorreos, 'buscar_correos', R3);
const enviarCorreoSeguro = proteger(enviarCorreo, 'enviar_correo', R2);
const listarEventosSeguro = proteger(listarEventos, 'listar_eventos', R3);
const crearEventoSeguro = proteger(crearEvento, 'crear_evento', R2);
const eliminarEventoSeguro = proteger(eliminarEvento, 'eliminar_evento', R2);
const subirArchivoSeguro = proteger(subirArchivo, 'subir_archivo', R2);
const buscarContactosSeguro = proteger(buscarContactos, 'buscar_contactos', R3);
const generarPresentacionSegura = proteger(generarPresentacion, 'generar_presentacion', R2);

// ── Tools locales (filesystem — sin circuit breaker) ─────────────────────────
const { generarExcel } = require('./excel');
const { generarExcelComparacion } = require('./excelComparacion');
const { generarWord } = require('./export');

// Tools que generan archivos en disco — requieren userId para prefixar el nombre (anti-IDOR)
const FILE_TOOLS = new Set(['generar_excel', 'generar_excel_comparacion', 'generar_word']);

// ── Mapa de despacho — nivel de módulo para no recrearlo en cada llamada ──────
const mapaTools = {
  buscar_precios: buscarPreciosSeguro,
  leer_correos: leerNoLeidosSeguro,
  buscar_correos: buscarCorreosSeguro,
  enviar_correo: enviarCorreoSeguro,
  listar_eventos: listarEventosSeguro,
  crear_evento: crearEventoSeguro,
  eliminar_evento: eliminarEventoSeguro,
  subir_archivo: subirArchivoSeguro,
  generar_excel: generarExcel,
  generar_excel_comparacion: generarExcelComparacion,
  generar_word: generarWord,
  generar_presentacion: generarPresentacionSegura,
  buscar_contactos: buscarContactosSeguro,
};

/**
 * Ejecuta una herramienta por nombre con los parámetros dados.
 *
 * @param {string} nombre - Nombre de la tool (debe coincidir con TOOLS[].name)
 * @param {Object} params - Parámetros de la tool
 * @param {string} userId - ID del usuario autenticado (se inyecta en FILE_TOOLS)
 * @returns {Promise<any>}
 * @throws {AppError} code: 'TOOL_NOT_FOUND'
 */
async function ejecutarTool(nombre, params, userId) {
  const fn = mapaTools[nombre];
  if (!fn) throw new AppError(`Tool desconocida: ${nombre}`, 'TOOL_NOT_FOUND', 400);
  const inputParams = FILE_TOOLS.has(nombre) ? { ...params, userId } : params;
  return fn(inputParams);
}

module.exports = { TOOLS, ejecutarTool };
