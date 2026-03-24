// routes/filesRoutes.js
// Routing + validación de entrada para GET /api/files/download.
// Protegido con JWT. Valida que el query param 'file' no tenga path traversal.

const { Router } = require('express');
const { query } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const { auditarAccion } = require('../middleware/auditoria');
const manejarErroresValidacion = require('../middleware/manejarErroresValidacion');
const { descargarArchivo } = require('../controllers/filesController');

const router = Router();

// GET /api/files/download?file=nombre.xlsx
router.get(
  '/download',
  verificarToken,
  auditarAccion('descarga_archivo'),
  [
    query('file')
      .trim()
      .notEmpty().withMessage('El parámetro file es obligatorio')
      .isLength({ max: 255 }).withMessage('Nombre de archivo demasiado largo')
      .not().matches(/[/\\]/).withMessage('El nombre de archivo no puede contener separadores de ruta')
      .not().contains('..').withMessage('El nombre de archivo no puede contener ..')
      // eslint-disable-next-line no-control-regex
      .not().matches(/\x00/).withMessage('El nombre de archivo no puede contener caracteres nulos'),
  ],
  manejarErroresValidacion,
  descargarArchivo
);

module.exports = router;
