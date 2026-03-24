// integrations/googleClient.js
// Cliente OAuth2 de Google. Punto de entrada único para todas las herramientas Google.
// Lee credenciales desde config — nunca desde process.env directamente (Base 3).

const { google } = require('googleapis');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'googleClient' });

/**
 * Retorna un cliente OAuth2 autenticado para la cuenta especificada.
 * Las credenciales se leen desde config.google.cuentaN (vienen del .env vía config/).
 *
 * @param {1|2} numeroCuenta - Número de cuenta Google a usar (1 o 2)
 * @returns {import('googleapis').Auth.OAuth2Client} cliente listo para usar
 * @throws {AppError} code: 'GOOGLE_ACCOUNT_NOT_FOUND' (404) si la cuenta no existe
 * @throws {AppError} code: 'GOOGLE_AUTH_ERROR' (500) si faltan credenciales
 */
function getGoogleClient(numeroCuenta = 1) {
  const cuentas = {
    1: config.google.cuenta1,
    2: config.google.cuenta2,
  };

  const cuenta = cuentas[numeroCuenta];

  if (!cuenta) {
    throw new AppError(
      `Cuenta Google ${numeroCuenta} no existe`,
      'GOOGLE_ACCOUNT_NOT_FOUND',
      404
    );
  }

  if (!cuenta.clientId || !cuenta.clientSecret || !cuenta.refreshToken) {
    throw new AppError(
      `Credenciales incompletas para cuenta Google ${numeroCuenta}`,
      'GOOGLE_AUTH_ERROR',
      500
    );
  }

  try {
    const auth = new google.auth.OAuth2(
      cuenta.clientId,
      cuenta.clientSecret,
      config.google.redirectUri
    );

    auth.setCredentials({ refresh_token: cuenta.refreshToken });

    logger.info('Cliente Google creado', { numeroCuenta });

    return auth;
  } catch (err) {
    logger.error('Error al crear cliente Google', { numeroCuenta, error: err.message });
    throw new AppError(
      `Error al autenticar cuenta Google ${numeroCuenta}`,
      'GOOGLE_AUTH_ERROR',
      500
    );
  }
}

module.exports = { getGoogleClient };
