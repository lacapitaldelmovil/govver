/**
 * Script de migración - Crear tablas en SQLite
 * Estructura basada en el Excel "Control Vehicular Operativo"
 */

const { initDatabase, query, closeDatabase } = require('./connection');

async function migrate() {
  console.log('🚀 Iniciando migración de base de datos...\n');

  await initDatabase();

  // Eliminar tablas existentes para recrear con nueva estructura
  const tables = ['registros_uso', 'asignaciones_conductor', 'registro_accesos', 
                  'mantenimientos', 'movimientos', 'solicitudes', 'vehiculos', 
                  'usuarios', 'secretarias'];
  
  for (const table of tables) {
    try {
      query(`DROP TABLE IF EXISTS ${table}`);
    } catch(e) {}
  }

  // Tabla de Dependencias/Secretarías
  query(`
    CREATE TABLE IF NOT EXISTS secretarias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      siglas TEXT NOT NULL UNIQUE,
      titular TEXT,
      email TEXT,
      telefono TEXT,
      direccion TEXT,
      activa INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla secretarias creada');

  // Tabla de Usuarios
  query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('admin', 'gobernacion', 'admin_secretaria', 'conductor')),
      secretaria_id INTEGER REFERENCES secretarias(id),
      telefono TEXT,
      cargo TEXT,
      activo INTEGER DEFAULT 1,
      ultimo_acceso TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla usuarios creada');

  // Tabla de Vehículos - Estructura completa según Excel
  query(`
    CREATE TABLE IF NOT EXISTS vehiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Identificación
      numero_inventario TEXT UNIQUE,
      numero_economico TEXT,
      placas TEXT,
      numero_serie TEXT,
      
      -- Descripción del vehículo
      descripcion TEXT,
      descripcion_detallada TEXT,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      anio INTEGER,
      color TEXT,
      tipo TEXT CHECK(tipo IN ('sedan', 'camioneta', 'pickup', 'suv', 'van', 'autobus', 'motocicleta', 'maquinaria', 'emergencia', 'otro')),
      
      -- Valores y fechas
      valor_libros REAL,
      fecha_adquisicion TEXT,
      
      -- Ubicación
      ubicacion_fisica TEXT,
      municipio TEXT,
      secretaria_id INTEGER REFERENCES secretarias(id),
      area_responsable TEXT,
      
      -- Documentación
      tarjeta_circulacion TEXT CHECK(tarjeta_circulacion IN ('Vigente', 'No vigente', 'En trámite', 'No aplica')),
      vigencia_tarjeta TEXT,
      
      -- Estado operativo
      estado_operativo TEXT DEFAULT 'Operando' CHECK(estado_operativo IN ('Operando', 'Disponible', 'Mal estado', 'En taller', 'Baja')),
      estatus TEXT CHECK(estatus IN ('Bueno', 'Regular', 'Malo')),
      en_uso INTEGER DEFAULT 1,
      kilometraje INTEGER DEFAULT 0,
      
      -- Seguro
      seguro TEXT CHECK(seguro IN ('Vigente', 'No vigente', 'En trámite')),
      poliza_seguro TEXT,
      vigencia_seguro TEXT,
      
      -- Régimen de propiedad
      regimen TEXT CHECK(regimen IN ('Propio', 'Arrendado', 'Comodato')),
      
      -- Datos de arrendamiento/comodato
      proveedor_arrendadora TEXT,
      renta_mensual REAL,
      vigencia_contrato TEXT,
      
      -- Contacto del área
      telefono_area TEXT,
      quien_reporta TEXT,
      
      -- Resguardante
      resguardante_nombre TEXT,
      resguardante_cargo TEXT,
      resguardante_telefono TEXT,
      
      -- Control
      observaciones TEXT,
      situacion_juridica TEXT,
      clasificacion TEXT CHECK(clasificacion IN ('operativo', 'donado', 'determinacion', 'comodato_externo')),
      propuesto_baja INTEGER DEFAULT 0,
      fecha_propuesta_baja TEXT,
      motivo_propuesta_baja TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla vehiculos creada');

  // Tabla de Solicitudes
  query(`
    CREATE TABLE IF NOT EXISTS solicitudes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folio TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL CHECK(tipo IN ('prestamo', 'transferencia', 'devolucion', 'baja', 'mantenimiento')),
      estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobada', 'rechazada', 'cancelada', 'en_proceso', 'completada')),
      vehiculo_id INTEGER REFERENCES vehiculos(id),
      secretaria_origen_id INTEGER REFERENCES secretarias(id),
      secretaria_destino_id INTEGER REFERENCES secretarias(id),
      usuario_solicitante_id INTEGER REFERENCES usuarios(id),
      usuario_autorizador_id INTEGER REFERENCES usuarios(id),
      fecha_solicitud TEXT DEFAULT (datetime('now')),
      fecha_inicio TEXT,
      fecha_fin TEXT,
      fecha_autorizacion TEXT,
      motivo TEXT NOT NULL,
      justificacion TEXT,
      observaciones TEXT,
      prioridad TEXT DEFAULT 'normal' CHECK(prioridad IN ('baja', 'normal', 'alta', 'urgente')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla solicitudes creada');

  // Tabla de Movimientos
  query(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehiculo_id INTEGER REFERENCES vehiculos(id),
      tipo_movimiento TEXT NOT NULL CHECK(tipo_movimiento IN ('entrada', 'salida', 'transferencia', 'mantenimiento', 'verificacion', 'siniestro', 'baja', 'alta')),
      secretaria_origen_id INTEGER REFERENCES secretarias(id),
      secretaria_destino_id INTEGER REFERENCES secretarias(id),
      usuario_id INTEGER REFERENCES usuarios(id),
      solicitud_id INTEGER REFERENCES solicitudes(id),
      descripcion TEXT,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla movimientos creada');

  // Tabla de Mantenimientos
  query(`
    CREATE TABLE IF NOT EXISTS mantenimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehiculo_id INTEGER REFERENCES vehiculos(id),
      tipo TEXT NOT NULL CHECK(tipo IN ('preventivo', 'correctivo', 'emergencia')),
      descripcion TEXT NOT NULL,
      proveedor TEXT,
      costo REAL,
      km_entrada INTEGER,
      km_salida INTEGER,
      fecha_entrada TEXT,
      fecha_salida TEXT,
      estado TEXT DEFAULT 'en_proceso' CHECK(estado IN ('programado', 'en_proceso', 'completado', 'cancelado')),
      factura TEXT,
      observaciones TEXT,
      usuario_registro_id INTEGER REFERENCES usuarios(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla mantenimientos creada');

  // Tabla de Proveedores
  query(`
    CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      rfc TEXT,
      contacto_nombre TEXT,
      contacto_email TEXT,
      contacto_telefono TEXT,
      direccion TEXT,
      giro TEXT,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT,
      secretaria_id INTEGER REFERENCES secretarias(id),
      servicios TEXT,
      monto_total_contratos REAL DEFAULT 0,
      numero_contratos INTEGER DEFAULT 0,
      calificacion INTEGER DEFAULT 0 CHECK(calificacion >= 0 AND calificacion <= 5),
      activo INTEGER DEFAULT 1,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla proveedores creada');

  // Tabla de Registro de Accesos
  query(`
    CREATE TABLE IF NOT EXISTS registro_accesos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER REFERENCES usuarios(id),
      accion TEXT NOT NULL,
      modulo TEXT,
      detalles TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla registro_accesos creada');

  console.log('\n🎉 Migración completada exitosamente');
  closeDatabase();
}

migrate().catch(console.error);
