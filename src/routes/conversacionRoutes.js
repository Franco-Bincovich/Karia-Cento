// routes/conversacionRoutes.js
// Routing + validación de entrada para /api/conversaciones.

const { Router } = require('express');
const { param } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const manejarErroresValidacion = require('../middleware/manejarErroresValidacion');
const { listarConversaciones, cargarConversacion } = require('../controllers/chatController');

const router = Router();

// GET /api/conversaciones
router.get('/', verificarToken, listarConversaciones);

// GET /api/conversaciones/:id
router.get(
  '/:id',
  verificarToken,
  [param('id').isUUID().withMessage('El id debe ser un UUID válido')],
  manejarErroresValidacion,
  cargarConversacion
);

module.exports = router;
