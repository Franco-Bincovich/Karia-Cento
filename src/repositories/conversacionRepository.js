// repositories/conversacionRepository.js
// Único punto de contacto con la tabla conversaciones.
// Nunca SQL raw concatenado — siempre el ORM de Supabase.

const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'conversacionRepository' });

/**
 * Obtiene las conversaciones de un usuario, ordenadas por actividad reciente.
 *
 * @param {string} userId
 * @param {number} [limite=20]
 * @returns {Promise<Object[]>} conversaciones ordenadas por updated_at desc
 */
async function findByUser(userId, limite = 20) {
  const { data, error } = await supabase
    .from('conversaciones_cento')
    .select('id, titulo, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limite);

  if (error) {
    logger.error('Error en findByUser', { error: error.message });
    throw new AppError('Error al obtener conversaciones', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Busca una conversación por ID verificando que pertenece al usuario.
 *
 * @param {string} id
 * @param {string} userId - para verificar ownership
 * @returns {Promise<Object|null>}
 */
async function findById(id, userId) {
  const { data, error } = await supabase
    .from('conversaciones_cento')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error('Error en findById conversacion', { error: error.message });
    throw new AppError('Error al obtener conversación', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Crea una nueva conversación vacía para un usuario.
 *
 * @param {string} userId
 * @param {string} [titulo]
 * @returns {Promise<Object>} conversación creada con messages: []
 */
async function create(userId, titulo) {
  const { data, error } = await supabase
    .from('conversaciones_cento')
    .insert({ user_id: userId, titulo: titulo || null, messages: [] })
    .select()
    .single();

  if (error) {
    logger.error('Error en create conversacion', { error: error.message });
    throw new AppError('Error al crear conversación', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Reemplaza el array de mensajes de una conversación.
 *
 * @param {string} id
 * @param {Object[]} messages - array completo actualizado
 * @param {string} userId - para verificar ownership antes de actualizar
 * @returns {Promise<Object>} conversación actualizada
 * @throws {AppError} code: 'CONVERSACION_NOT_FOUND'
 */
async function updateMessages(id, messages, userId) {
  const { data, error } = await supabase
    .from('conversaciones_cento')
    .update({ messages, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    logger.error('Error en updateMessages', { error: error.message });
    throw new AppError('Error al actualizar conversación', 'DB_ERROR', 500);
  }
  if (!data) {
    throw new AppError('Conversación no encontrada', 'CONVERSACION_NOT_FOUND', 404);
  }
  return data;
}

module.exports = { findByUser, findById, create, updateMessages };
