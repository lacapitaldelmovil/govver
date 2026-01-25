/**
 * Sistema de Gestión de Flota Vehicular del Estado de Veracruz
 * Punto de entrada del servidor backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar conexión a base de datos
const { initDatabase } = require('./database/connection');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const vehiculosRoutes = require('./routes/vehiculos.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const secretariasRoutes = require('./routes/secretarias.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const movimientosRoutes = require('./routes/movimientos.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportesRoutes = require('./routes/reportes.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');

// Importar middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE DE SEGURIDAD
// ============================================

// Helmet para headers de seguridad
app.use(helmet());

// CORS configurado
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting para prevenir ataques
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes, intente de nuevo más tarde'
  }
});
app.use('/api/', limiter);

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// RUTAS
// ============================================

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Flota Veracruz API'
  });
});

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/secretarias', secretariasRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/proveedores', proveedoresRoutes);

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejador global de errores
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

async function startServer() {
  try {
    // Inicializar base de datos
    await initDatabase();
    console.log('✅ Base de datos inicializada');

    app.listen(PORT, () => {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║   SISTEMA DE FLOTA VEHICULAR - GOBIERNO DE VERACRUZ   ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log(`║   Servidor corriendo en puerto: ${PORT}                    ║`);
      console.log(`║   Ambiente: ${process.env.NODE_ENV || 'development'}                           ║`);
      console.log('╚════════════════════════════════════════════════════════╝');
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
