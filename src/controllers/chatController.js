// controllers/chatController.js
// Orquesta el flujo de /api/chat. Sin lógica de negocio.

const { AppError } = require('../middleware/errorHandler');
const { ejecutarAgente } = require('../agent');
const cola = require('../utils/cola');
const conversacionRepo = require('../repositories/conversacionRepository');
const logger = require('../utils/logger').child({ module: 'chatController' });

/**
 * POST /api/chat
 * Body: { mensaje: string, conversacionId?: string }
 * Requiere JWT válido (req.user adjuntado por verificarToken).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function chat(req, res, next) {
  try {
    const { mensaje, conversacionId } = req.body;
    const { userId } = req.user;

    // 1. Obtener o crear conversación
    let conversacion;
    if (conversacionId) {
      conversacion = await conversacionRepo.findById(conversacionId, userId);
      if (!conversacion) {
        throw new AppError('Conversación no encontrada', 'CONVERSACION_NOT_FOUND', 404);
      }
    } else {
      conversacion = await conversacionRepo.create(userId);
    }

    // 2. Cargar historial
    const historial = conversacion.messages || [];

    logger.info('Iniciando chat', { userId, conversacionId: conversacion.id, mensajeLen: mensaje.length });

    // 3 & 4. Encolar y ejecutar el agente
    const resultado = await cola.add(() => ejecutarAgente({ mensaje, historial, userId }));

    // 5. Persistir mensajes actualizados
    await conversacionRepo.updateMessages(conversacion.id, resultado.mensajesActualizados, userId);

    // 6. Responder
    res.json({ respuesta: resultado.respuesta, conversacionId: conversacion.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat };
