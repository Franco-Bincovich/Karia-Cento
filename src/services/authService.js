// services/authService.js
// Lógica de negocio de autenticación.
// El controller solo orquesta — toda la lógica vive acá.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const userRepo = require('../repositories/userRepository');
const logger = require('../utils/logger').child({ module: 'authService' });

// Hash ficticio para bcrypt.compare() cuando el usuario no existe — previene timing attack (H2)
const DUMMY_HASH = '$2a$12$KIXHkMhXiQj5Y8rPvbLOXuGpQSHbL8JJQf3bXvRmNpT8kJhGqD4Hy';

// Rate limit por cuenta — Map<email, { count, timeout }> (H3)
const MAX_INTENTOS = 10;
const TTL_MS = 15 * 60 * 1000; // 15 minutos
const intentosFallidos = new Map();

function registrarFallo(email) {
  const entrada = intentosFallidos.get(email) || { count: 0, timeout: null };
  clearTimeout(entrada.timeout);
  entrada.count += 1;
  entrada.timeout = setTimeout(() => intentosFallidos.delete(email), TTL_MS);
  intentosFallidos.set(email, entrada);
}

function resetearIntentos(email) {
  const entrada = intentosFallidos.get(email);
  if (entrada) clearTimeout(entrada.timeout);
  intentosFallidos.delete(email);
}

/**
 * Autentica un usuario con email y contraseña.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: Object }>}
 * @throws {AppError} code: 'INVALID_CREDENTIALS' (401) si email/password incorrectos
 * @throws {AppError} code: 'USER_INACTIVE' (403) si el usuario está desactivado
 * @throws {AppError} code: 'ACCOUNT_LOCKED' (429) si se superaron 10 intentos fallidos
 */
async function login(email, password) {
  // 1. Verificar bloqueo por intentos fallidos (H3)
  const intentos = intentosFallidos.get(email);
  if (intentos && intentos.count >= MAX_INTENTOS) {
    throw new AppError('Cuenta bloqueada temporalmente por múltiples intentos fallidos', 'ACCOUNT_LOCKED', 429);
  }

  // 2. Buscar usuario y comparar siempre con bcrypt — previene timing attack (H2)
  const usuario = await userRepo.findByEmail(email);
  const hashAComparar = usuario ? usuario.password_hash : DUMMY_HASH;
  const coincide = await bcrypt.compare(password, hashAComparar);

  if (!usuario || !coincide) {
    registrarFallo(email);
    throw new AppError('Credenciales inválidas', 'INVALID_CREDENTIALS', 401);
  }

  // 3. Verificar que el usuario esté activo
  if (!usuario.activo) {
    throw new AppError('Usuario inactivo', 'USER_INACTIVE', 403);
  }

  resetearIntentos(email);

  // 4. Generar JWT
  const token = jwt.sign(
    { userId: usuario.id, email: usuario.email, rol: usuario.rol },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  logger.info('Login exitoso', { userId: usuario.id, email: usuario.email });

  // 5. Retornar token y datos públicos del usuario
  return {
    token,
    user: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      needs_password_reset: usuario.needs_password_reset,
    },
  };
}

/**
 * Cambia la contraseña de un usuario autenticado.
 *
 * @param {string} userId
 * @param {string} nuevaPassword
 * @returns {Promise<void>}
 * @throws {AppError} code: 'PASSWORD_TOO_SHORT' (400) si tiene menos de 8 caracteres
 * @throws {AppError} code: 'USER_NOT_FOUND' (404) si el usuario no existe
 */
async function cambiarPassword(userId, nuevaPassword) {
  // 1. Validar longitud mínima (defensa en profundidad)
  if (!nuevaPassword || nuevaPassword.length < 8) {
    throw new AppError('La contraseña debe tener al menos 8 caracteres', 'PASSWORD_TOO_SHORT', 400);
  }

  // 2. Hashear con 12 rounds (Base 9)
  const password_hash = await bcrypt.hash(nuevaPassword, 12);

  // 3. Persistir — userRepo.update lanza USER_NOT_FOUND si no existe
  await userRepo.update(userId, { password_hash, needs_password_reset: false });

  logger.info('Contraseña cambiada', { userId });
}

module.exports = { login, cambiarPassword };
