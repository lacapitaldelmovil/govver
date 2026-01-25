/**
 * Rutas de autenticación - SQLite
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'flota-veracruz-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * POST /api/auth/login
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const result = query(
      `SELECT u.*, s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
       FROM usuarios u
       LEFT JOIN secretarias s ON u.secretaria_id = s.id
       WHERE u.email = ?`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];

    // Verificar si está activo
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario inactivo. Contacte al administrador.' });
    }

    // Verificar contraseña
    const passwordValido = bcrypt.compareSync(password, usuario.password);
    
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar último acceso
    query(`UPDATE usuarios SET ultimo_acceso = datetime('now') WHERE id = ?`, [usuario.id]);

    // Generar token
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombre,
        secretaria_id: usuario.secretaria_id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        secretaria_id: usuario.secretaria_id,
        secretaria_nombre: usuario.secretaria_nombre,
        secretaria_siglas: usuario.secretaria_siglas
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Sesión cerrada exitosamente' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    const result = query(
      `SELECT u.id, u.email, u.nombre, u.rol, u.secretaria_id, u.telefono, u.activo, u.ultimo_acceso,
              s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
       FROM usuarios u
       LEFT JOIN secretarias s ON u.secretaria_id = s.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
  }
});

/**
 * PUT /api/auth/password
 */
router.put('/password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Obtener usuario actual
    const result = query('SELECT password FROM usuarios WHERE id = ?', [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    if (!bcrypt.compareSync(currentPassword, result.rows[0].password)) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Actualizar contraseña
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    query('UPDATE usuarios SET password = ?, updated_at = datetime(\'now\') WHERE id = ?', 
      [hashedPassword, req.user.id]);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

module.exports = router;
