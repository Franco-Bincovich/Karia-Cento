// repositories/userRepository.js
// Único punto de contacto con la tabla users.
// Nunca SQL raw concatenado — siempre el ORM de Supabase.

const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'userRepository' });

/**
 * Busca un usuario por email.
 *
 * @param {string} email
 * @returns {Promise<Object|null>} usuario o null si no existe
 */
async function findByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    logger.error('Error en findByEmail', { error: error.message });
    throw new AppError('Error al buscar usuario', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Busca un usuario por ID.
 *
 * @param {string} id
 * @returns {Promise<Object|null>} usuario o null si no existe
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error('Error en findById', { error: error.message });
    throw new AppError('Error al buscar usuario', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Crea un nuevo usuario.
 *
 * @param {{ email: string, password_hash: string, nombre: string, rol: string }} datos
 * @returns {Promise<Object>} usuario creado
 * @throws {AppError} code: 'EMAIL_ALREADY_EXISTS' si el email ya existe
 */
async function create(datos) {
  const { data, error } = await supabase
    .from('users')
    .insert(datos)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('El email ya está registrado', 'EMAIL_ALREADY_EXISTS', 409);
    }
    logger.error('Error en create user', { error: error.message });
    throw new AppError('Error al crear usuario', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Actualiza campos de un usuario existente.
 *
 * @param {string} id
 * @param {{ needs_password_reset?: boolean, activo?: boolean, nombre?: string, password_hash?: string }} campos
 * @returns {Promise<Object>} usuario actualizado
 * @throws {AppError} code: 'USER_NOT_FOUND' si no existe
 */
async function update(id, campos) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    logger.error('Error en update user', { error: error.message });
    throw new AppError('Error al actualizar usuario', 'DB_ERROR', 500);
  }
  if (!data) {
    throw new AppError('Usuario no encontrado', 'USER_NOT_FOUND', 404);
  }
  return data;
}

module.exports = { findByEmail, findById, create, update };
