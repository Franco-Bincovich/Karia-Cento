// routes/chatRoutes.js
// Routing + validación de entrada para /api/chat.

const { Router } = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { verificarToken } = require('../middleware/auth');
const manejarErroresValidacion = require('../middleware/manejarErroresValidacion');
const { chat } = require('../controllers/chatController');

const router = Router();

const chatRateLimiter = rateLimit({
  windowMs: config.rateLimit.chat.windowMs,
  max: config.rateLimit.chat.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Demasiados mensajes, esperá un momento', code: 'RATE_LIMIT_EXCEEDED' },
});

// POST /api/chat
router.post(
  '/',
  verificarToken,
  chatRateLimiter,
  [
    body('mensaje').isString().withMessage('El mensaje debe ser texto').trim().isLength({ min: 1, max: 4000 }).withMessage('El mensaje debe tener entre 1 y 4000 caracteres'),
    body('conversacionId').optional().isUUID().withMessage('conversacionId debe ser un UUID válido'),
  ],
  manejarErroresValidacion,
  chat
);

module.exports = router;
