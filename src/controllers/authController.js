// controllers/authController.js
// Solo orquestación — sin lógica de negocio.
// Toda la lógica vive en authService.js.

const authService = require('../services/authService');

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Responde con { token, user } si las credenciales son válidas.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const resultado = await authService.login(email, password);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/cambiar-password
 * Body: { nuevaPassword }
 * Requiere JWT válido (verificarToken ya adjuntó req.user).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function cambiarPasswordController(req, res, next) {
  try {
    const { nuevaPassword } = req.body;
    await authService.cambiarPassword(req.user.userId, nuevaPassword);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

module.exports = { loginController, cambiarPasswordController };
