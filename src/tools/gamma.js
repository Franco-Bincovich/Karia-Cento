// tools/gamma.js
// Integración con Gamma AI para generación de presentaciones.

const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'gamma' });

const GAMMA_API_BASE = 'https://api.gamma.app/api';
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_INTENTOS = 20;

/**
 * Llama a la API de Gamma y retorna el generationId.
 *
 * @param {string} titulo
 * @param {string} contenido
 * @returns {Promise<string>} generationId
 */
async function iniciarGeneracion(titulo, contenido) {
  const res = await fetch(`${GAMMA_API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.gamma.apiKey}`,
    },
    body: JSON.stringify({
      inputText: `${titulo}\n\n${contenido}`,
      format: 'presentation',
      textOptions: { language: 'es' },
    }),
  });

  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Gamma generate HTTP ${res.status}: ${texto}`);
  }

  const data = await res.json();
  if (!data.generationId) throw new Error('Gamma no retornó generationId');
  return data.generationId;
}

/**
 * Consulta el estado de una generación y retorna la URL cuando esté lista.
 *
 * @param {string} generationId
 * @returns {Promise<string>} gammaUrl
 */
async function esperarGeneracion(generationId) {
  for (let i = 0; i < POLL_MAX_INTENTOS; i++) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(`${GAMMA_API_BASE}/generate/${generationId}`, {
      headers: { Authorization: `Bearer ${config.gamma.apiKey}` },
    });

    if (!res.ok) throw new Error(`Gamma status HTTP ${res.status}`);

    // eslint-disable-next-line no-await-in-loop
    const data = await res.json();

    if (data.status === 'completed' && data.gammaUrl) {
      return data.gammaUrl;
    }

    if (data.status === 'failed') {
      throw new Error(`Gamma generation failed: ${data.error || 'sin detalle'}`);
    }

    logger.info('Gamma generando...', { generationId, intento: i + 1, status: data.status });
  }

  throw new Error('Timeout esperando generación de Gamma');
}

/**
 * Genera una presentación usando Gamma AI.
 *
 * @param {{ titulo: string, contenido: string }} params
 * @returns {Promise<{ url: string, gammaId: string }>}
 * @throws {AppError} code: 'GAMMA_ERROR'
 */
async function generarPresentacion({ titulo, contenido }) {
  try {
    logger.info('Iniciando generación Gamma', { titulo });

    const generationId = await iniciarGeneracion(titulo, contenido);
    const url = await esperarGeneracion(generationId);

    logger.info('Presentación Gamma generada', { generationId, url });
    return { url, gammaId: generationId };
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en Gamma', { error: err.message });
    throw new AppError(`Error al generar presentación: ${err.message}`, 'GAMMA_ERROR', 500);
  }
}

module.exports = { generarPresentacion };
