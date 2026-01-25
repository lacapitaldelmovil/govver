/**
 * Middleware de autenticación y autorización - SQLite
 */

const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'flota-veracruz-secret-key-2024';

/**
 * Middleware principal de autenticación
 */
const authMiddleware = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Acceso no autorizado',
        message: 'Token de autenticación requerido'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuario en BD
    const result = query(
      `SELECT u.*, s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
       FROM usuarios u
       LEFT JOIN secretarias s ON u.secretaria_id = s.id
       WHERE u.id = ? AND u.activo = 1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado o inactivo'
      });
    }

    // Adjuntar usuario al request
    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      nombre: result.rows[0].nombre,
      rol: result.rows[0].rol,
      secretaria_id: result.rows[0].secretaria_id,
      secretaria_nombre: result.rows[0].secretaria_nombre,
      secretaria_siglas: result.rows[0].secretaria_siglas
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Por favor inicie sesión nuevamente'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    console.error('Error de autenticación:', error);
    return res.status(500).json({
      error: 'Error de autenticación'
    });
  }
};

/**
 * Middleware para verificar roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `Se requiere uno de los siguientes roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Middleware para requerir rol de administrador (Super Admin o Gobernación)
 */
const requireAdmin = requireRole('admin', 'gobernacion');

/**
 * Middleware para Super Admin únicamente
 */
const requireSuperAdmin = requireRole('admin');

/**
 * Middleware para Gobernación (con o sin Super Admin)
 */
const requireGobernacion = requireRole('admin', 'gobernacion');

/**
 * Middleware para administradores de secretaría
 */
const requireAdminSecretaria = requireRole('admin', 'gobernacion', 'admin_secretaria');

/**
 * Registrar acceso a módulo (opcional)
 */
const logAccess = (userId, accion, modulo, req) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    query(
      `INSERT INTO registro_accesos (usuario_id, accion, modulo, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, accion, modulo, ip, userAgent]
    );
  } catch (error) {
    console.error('Error registrando acceso:', error);
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireGobernacion,
  requireAdminSecretaria,
  logAccess
};
