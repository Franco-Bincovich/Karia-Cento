// routes/authRoutes.js
// Routing + validación de entrada para /api/auth.
// Sin lógica de negocio — todo pasa al controller.

const { Router } = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const manejarErroresValidacion = require('../middleware/manejarErroresValidacion');
const { verificarToken } = require('../middleware/auth');
const { auditarAccion } = require('../middleware/auditoria');
const { loginController, cambiarPasswordController } = require('../controllers/authController');

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: config.rateLimit.login.windowMs,
  max: config.rateLimit.login.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Demasiados intentos, intentá más tarde', code: 'RATE_LIMIT_EXCEEDED' },
});

// POST /api/auth/login
router.post(
  '/login',
  loginRateLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isString().withMessage('La contraseña debe ser texto').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  ],
  manejarErroresValidacion,
  loginController
);

// POST /api/auth/cambiar-password  (requiere JWT)
router.post(
  '/cambiar-password',
  verificarToken,
  auditarAccion('cambiar_password'),
  [
    body('nuevaPassword').isString().withMessage('La contraseña debe ser texto').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  ],
  manejarErroresValidacion,
  cambiarPasswordController
);

module.exports = router;
