// tools/google/contactos.js
// Herramientas de Google Contacts para el agente Claude.

const { google } = require('googleapis');
const { getGoogleClient } = require('./auth');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'contactos' });

/**
 * Busca contactos de Google por nombre o email usando la People API.
 *
 * @param {{ numeroCuenta?: number, query: string }} params
 * @returns {Promise<Object[]>} array de { nombre, email, telefono }
 * @throws {AppError} code: 'CONTACTS_ERROR'
 */
async function buscarContactos({ numeroCuenta = 1, query }) {
  try {
    const auth = getGoogleClient(numeroCuenta);
    const people = google.people({ version: 'v1', auth });

    const respuesta = await people.people.searchContacts({
      query,
      readMask: 'names,emailAddresses,phoneNumbers',
      pageSize: 10,
    });

    const contactos = (respuesta.data.results || []).map((r) => {
      const p = r.person;
      return {
        nombre: (p.names && p.names[0] && p.names[0].displayName) || '',
        email: (p.emailAddresses && p.emailAddresses[0] && p.emailAddresses[0].value) || '',
        telefono: (p.phoneNumbers && p.phoneNumbers[0] && p.phoneNumbers[0].value) || '',
      };
    });

    logger.info('Contactos encontrados', { numeroCuenta, query, cantidad: contactos.length });
    return contactos;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en buscarContactos', { error: err.message });
    throw new AppError('Error al buscar contactos', 'CONTACTS_ERROR', 500);
  }
}

module.exports = { buscarContactos };
