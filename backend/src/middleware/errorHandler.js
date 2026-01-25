/**
 * Middleware de manejo global de errores
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }

  // Error de autenticación
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }

  // Error de token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado'
    });
  }

  // Error de base de datos SQLite
  if (err.code && err.code.startsWith('SQLITE')) {
    return res.status(500).json({
      error: 'Error de base de datos',
      code: err.code
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
};

module.exports = { errorHandler };
