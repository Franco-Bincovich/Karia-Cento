// tools/google/gmail.js
// Herramientas de Gmail para el agente Claude.

const { google } = require('googleapis');
const { getGoogleClient } = require('./auth');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'gmail' });

/**
 * Construye un mensaje RFC 2822 en base64url para la API de Gmail.
 *
 * @param {string} to
 * @param {string} subject
 * @param {string} body
 * @returns {string} mensaje codificado
 */
function buildRawMessage(to, subject, body) {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
  ];
  return Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Lee los correos no leídos de la cuenta especificada.
 *
 * @param {{ numeroCuenta?: number, maxResults?: number }} params
 * @returns {Promise<Object[]>} array de { id, from, subject, snippet, date }
 * @throws {AppError} code: 'GMAIL_ERROR'
 */
async function leerNoLeidos({ numeroCuenta = 1, maxResults = 10 }) {
  try {
    const auth = getGoogleClient(numeroCuenta);
    const gmail = google.gmail({ version: 'v1', auth });

    const lista = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults,
    });

    const mensajes = lista.data.messages || [];
    const resultados = await Promise.all(
      mensajes.map(async (m) => {
        const detalle = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'] });
        const headers = detalle.data.payload.headers;
        const get = (name) => (headers.find((h) => h.name === name) || {}).value || '';
        return { id: m.id, from: get('From'), subject: get('Subject'), snippet: detalle.data.snippet, date: get('Date') };
      })
    );

    logger.info('Correos no leídos obtenidos', { numeroCuenta, cantidad: resultados.length });
    return resultados;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en leerNoLeidos', { error: err.message });
    throw new AppError('Error al leer correos', 'GMAIL_ERROR', 500);
  }
}

/**
 * Busca correos por query de Gmail.
 *
 * @param {{ numeroCuenta?: number, query: string, maxResults?: number }} params
 * @returns {Promise<Object[]>} array de { id, from, subject, snippet, date }
 * @throws {AppError} code: 'GMAIL_ERROR'
 */
async function buscarCorreos({ numeroCuenta = 1, query, maxResults = 10 }) {
  try {
    const auth = getGoogleClient(numeroCuenta);
    const gmail = google.gmail({ version: 'v1', auth });

    const lista = await gmail.users.messages.list({ userId: 'me', q: query, maxResults });
    const mensajes = lista.data.messages || [];

    const resultados = await Promise.all(
      mensajes.map(async (m) => {
        const detalle = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'] });
        const headers = detalle.data.payload.headers;
        const get = (name) => (headers.find((h) => h.name === name) || {}).value || '';
        return { id: m.id, from: get('From'), subject: get('Subject'), snippet: detalle.data.snippet, date: get('Date') };
      })
    );

    logger.info('Búsqueda de correos completada', { numeroCuenta, query, cantidad: resultados.length });
    return resultados;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en buscarCorreos', { error: err.message });
    throw new AppError('Error al buscar correos', 'GMAIL_ERROR', 500);
  }
}

/**
 * Envía un correo electrónico desde la cuenta especificada.
 *
 * @param {{ numeroCuenta?: number, to: string, subject: string, body: string }} params
 * @returns {Promise<{ messageId: string }>}
 * @throws {AppError} code: 'GMAIL_SEND_ERROR'
 */
async function enviarCorreo({ numeroCuenta = 1, to, subject, body }) {
  try {
    const auth = getGoogleClient(numeroCuenta);
    const gmail = google.gmail({ version: 'v1', auth });

    const raw = buildRawMessage(to, subject, body);
    const resultado = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });

    logger.info('Correo enviado', { numeroCuenta, to, messageId: resultado.data.id });
    return { messageId: resultado.data.id };
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en enviarCorreo', { error: err.message });
    throw new AppError('Error al enviar correo', 'GMAIL_SEND_ERROR', 500);
  }
}

module.exports = { leerNoLeidos, buscarCorreos, enviarCorreo };
