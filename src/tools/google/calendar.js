// tools/google/calendar.js
// Herramientas de Google Calendar para el agente Claude.

const { google } = require('googleapis');
const { getGoogleClient } = require('./auth');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'calendar' });

/**
 * Lista eventos del calendario principal de la cuenta.
 *
 * @param {{ numeroCuenta?: number, desde?: string, hasta?: string, maxResults?: number }} params
 * @returns {Promise<Object[]>} array de { id, summary, start, end, location }
 * @throws {AppError} code: 'CALENDAR_ERROR'
 */
async function listarEventos({ numeroCuenta = 1, desde, hasta, maxResults = 10 }) {
  try {
    const auth = getGoogleClient(numeroCuenta);
    const calendar = google.calendar({ version: 'v3', auth });

    const params = {
      calendarId: 'primary',
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: desde || new Date().toISOString(),
    };
    if (hasta) params.timeMax = hasta;

    const respuesta = await calendar.events.list(params);
    const eventos = (respuesta.data.items || []).map((e) => ({
      id: e.id,
      summary: e.summary,
      start: e.start.dateTime || e.start.date,
      end: e.end.dateTime || e.end.date,
      location: e.location || null,
    }));

    logger.info('Eventos listados', { numeroCuenta, cantidad: eventos.length });
    return eventos;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en listarEventos', { error: err.message });
    throw new AppError('Error al listar eventos', 'CALENDAR_ERROR', 500);
  }
}

/**
 * Crea un evento en el calendario principal de la cuenta.
 *
 * @param {{ numeroCuenta?: number, titulo: string, inicio: string, fin: string, descripcion?: string }} params
 * @returns {Promise<{ id: string, htmlLink: string }>}
 * @throws {AppError} code: 'CALENDAR_ERROR'
 */
async function crearEvento({ numeroCuenta = 1, titulo, inicio, fin, descripcion }) {
  try {
    const auth = getGoogleClient(numeroCuenta);
    const calendar = google.calendar({ version: 'v3', auth });

    const evento = {
      summary: titulo,
      description: descripcion || '',
      start: { dateTime: inicio },
      end: { dateTime: fin },
    };

    const respuesta = await calendar.events.insert({ calendarId: 'primary', requestBody: evento });

    logger.info('Evento creado', { numeroCuenta, titulo, id: respuesta.data.id });
    return { id: respuesta.data.id, htmlLink: respuesta.data.htmlLink };
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en crearEvento', { error: err.message });
    throw new AppError('Error al crear evento', 'CALENDAR_ERROR', 500);
  }
}

/**
 * Elimina un evento del calendario principal de la cuenta.
 *
 * @param {{ numeroCuenta?: number, eventId: string }} params
 * @returns {Promise<void>}
 * @throws {AppError} code: 'CALENDAR_ERROR'
 */
async function eliminarEvento({ numeroCuenta = 1, eventId }) {
  try {
    const auth = getGoogleClient(numeroCuenta);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({ calendarId: 'primary', eventId });

    logger.info('Evento eliminado', { numeroCuenta, eventId });
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en eliminarEvento', { error: err.message });
    throw new AppError('Error al eliminar evento', 'CALENDAR_ERROR', 500);
  }
}

module.exports = { listarEventos, crearEvento, eliminarEvento };
