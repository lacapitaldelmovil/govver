/**
 * Script de migración - Crear tablas en SQLite
 * Estructura basada en el Excel "Control Vehicular Operativo"
 */

const { initDatabase, query, closeDatabase } = require('./connection');

async function migrate() {
  console.log('🚀 Iniciando migración de base de datos...\n');

  await initDatabase();

  // Eliminar tablas existentes para recrear con nueva estructura
  const tables = ['cargas_combustible', 'incidencias', 'registros_uso', 'asignaciones_conductor', 'asignaciones', 'registro_accesos', 
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

  // Tabla de Vehículos - Estructura completa según Excel Padrón Vehicular 62 variables
  query(`
    CREATE TABLE IF NOT EXISTS vehiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- ========== 1. IDENTIFICACIÓN ==========
      numero_inventario TEXT UNIQUE,
      placas TEXT,
      numero_serie TEXT,
      numero_motor TEXT,
      numero_economico TEXT,
      
      -- ========== 2. CARACTERÍSTICAS DEL VEHÍCULO ==========
      marca TEXT,
      linea TEXT,
      modelo TEXT,
      anio INTEGER,
      color TEXT,
      tipo TEXT,
      capacidad_pasajeros INTEGER,
      tipo_combustible TEXT,
      cilindros INTEGER,
      transmision TEXT,
      clase TEXT,
      puertas INTEGER,
      ejes INTEGER,
      traccion TEXT,
      origen TEXT,
      descripcion TEXT,
      descripcion_detallada TEXT,
      cilindraje TEXT,
      
      -- ========== 3. ASIGNACIÓN ==========
      secretaria_id INTEGER REFERENCES secretarias(id),
      municipio TEXT,
      area_responsable TEXT,
      telefono_area TEXT,
      quien_reporta TEXT,
      asignacion_actual TEXT,
      
      -- ========== 4. ADQUISICIÓN ==========
      forma_adquisicion TEXT,
      fecha_adquisicion TEXT,
      valor_libros REAL,
      proveedor TEXT,
      proveedor_unidad TEXT,
      numero_factura TEXT,
      regimen TEXT,
      uso TEXT,
      valor_contrato REAL,
      cfdi TEXT,
      contrato TEXT,
      factura_original TEXT,
      valor_factura REAL,
      valor_mercado REAL,
      
      -- ========== 5. DOCUMENTACIÓN (PLACAS) ==========
      tipo_placas TEXT,
      fecha_expedicion_placas TEXT,
      acta_entrega_recepcion TEXT,
      resguardo_vehicular TEXT,
      tarjeta_circulacion TEXT,
      vigencia_tarjeta TEXT,
      verificacion_vehicular TEXT,
      vigencia_verificacion TEXT,
      comprobante_reemplacamiento TEXT,
      pago_derechos TEXT,
      
      -- ========== 6. INVENTARIO ==========
      refrendado TEXT,
      ultimo_refrendo TEXT,
      inventario_patrimonial TEXT,
      fecha_alta_inventario TEXT,
      bitacora_mantenimiento TEXT,
      
      -- ========== 7. ESTATUS ==========
      estatus_operativo TEXT DEFAULT 'Operando',
      estatus_administrativo TEXT DEFAULT 'Activo',
      estatus TEXT,
      estado_operativo TEXT DEFAULT 'Operando',
      en_uso INTEGER DEFAULT 1,
      propuesto_baja INTEGER DEFAULT 0,
      fecha_propuesta_baja TEXT,
      motivo_propuesta_baja TEXT,
      
      -- ========== 8. UBICACIÓN ==========
      ubicacion_fisica TEXT,
      direccion_ubicacion TEXT,
      ubicacion_especifica TEXT,
      
      -- ========== 9. RESGUARDATARIO ==========
      resguardante_nombre TEXT,
      resguardante_cargo TEXT,
      resguardante_telefono TEXT,
      resguardante_email TEXT,
      fecha_resguardo TEXT,
      
      -- ========== 10. SEGURO ==========
      seguro TEXT,
      aseguradora TEXT,
      poliza_seguro TEXT,
      vigencia_seguro TEXT,
      tipo_cobertura TEXT,
      suma_asegurada REAL,
      
      -- ========== 11. MANTENIMIENTO Y CONDICIÓN ==========
      kilometraje INTEGER DEFAULT 0,
      fecha_ultimo_servicio TEXT,
      proximo_servicio_km INTEGER,
      ultimo_servicio TEXT,
      porcentaje_motor INTEGER,
      porcentaje_transmision INTEGER,
      porcentaje_chasis INTEGER,
      consumo_combustible REAL,
      costo_mantenimiento_anual REAL,
      proveedor_mantenimiento TEXT,
      desglose_mantenimiento TEXT,
      observaciones_tecnicas TEXT,
      
      -- ========== 11.1 MECÁNICO ==========
      costo_anual_mecanico REAL,
      frecuencia_mecanico INTEGER,
      desglose_mecanico TEXT,
      proveedor_mecanico TEXT,
      
      -- ========== 11.2 ELÉCTRICO ==========
      costo_anual_electrico REAL,
      frecuencia_electrico INTEGER,
      desglose_electrico TEXT,
      proveedor_electrico TEXT,
      
      -- ========== 12. UBICACIÓN GEOREFERENCIADA ==========
      latitud REAL,
      longitud REAL,
      direccion_completa TEXT,
      
      -- ========== 13. PRÉSTAMO / ARRENDAMIENTO ==========
      proveedor_arrendadora TEXT,
      renta_mensual REAL,
      vigencia_contrato TEXT,
      prestamo_activo INTEGER DEFAULT 0,
      prestamo_destino TEXT,
      prestamo_responsable TEXT,
      prestamo_fecha_inicio TEXT,
      prestamo_fecha_fin TEXT,
      comodato_activo INTEGER DEFAULT 0,
      comodato_institucion TEXT,
      comodato_fecha_inicio TEXT,
      comodato_fecha_fin TEXT,
      
      -- ========== 13. EVIDENCIA ==========
      foto_url TEXT,
      documento_url TEXT,
      evidencia_fotografica TEXT,
      
      -- ========== EXTRAS ==========
      observaciones TEXT,
      situacion_juridica TEXT,
      clasificacion TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla vehiculos creada (62 variables del Padrón Vehicular)');

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

  // Tabla de Asignaciones (salida/entrada de vehículos a personas)
  query(`
    CREATE TABLE IF NOT EXISTS asignaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folio TEXT NOT NULL UNIQUE,
      vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
      secretaria_id INTEGER REFERENCES secretarias(id),

      -- Persona a quien se asigna
      conductor_nombre TEXT NOT NULL,
      conductor_cargo TEXT,
      conductor_telefono TEXT,
      conductor_email TEXT,
      conductor_licencia TEXT,

      -- Salida
      fecha_salida TEXT NOT NULL,
      hora_salida TEXT,
      km_salida INTEGER,
      combustible_salida TEXT,
      destino TEXT,
      motivo TEXT NOT NULL,

      -- Entrada / Devolución
      fecha_entrada TEXT,
      hora_entrada TEXT,
      km_entrada INTEGER,
      combustible_entrada TEXT,
      estado_devolucion TEXT,

      -- Estado general
      estado TEXT DEFAULT 'en_uso' CHECK(estado IN ('en_uso', 'devuelto', 'cancelado')),
      observaciones_salida TEXT,
      observaciones_entrada TEXT,

      -- Quién registró
      usuario_registro_id INTEGER REFERENCES usuarios(id),
      usuario_devolucion_id INTEGER REFERENCES usuarios(id),

      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla asignaciones creada');

  // Tabla de Cargas de Combustible
  query(`
    CREATE TABLE IF NOT EXISTS cargas_combustible (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
      fecha TEXT NOT NULL,
      hora TEXT,
      litros REAL NOT NULL,
      costo_total REAL,
      precio_litro REAL,
      tipo_combustible TEXT DEFAULT 'gasolina' CHECK(tipo_combustible IN ('gasolina_regular','gasolina_premium','diesel','gas_lp','electrico')),
      km_actual INTEGER,
      rendimiento_km_litro REAL,
      estacion TEXT,
      numero_bomba TEXT,
      conductor_nombre TEXT,
      cfdi TEXT,
      metodo_pago TEXT,
      observaciones TEXT,
      usuario_registro_id INTEGER REFERENCES usuarios(id),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla cargas_combustible creada');

  // Tabla de Incidencias / Siniestros
  query(`
    CREATE TABLE IF NOT EXISTS incidencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folio TEXT UNIQUE,
      vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
      fecha TEXT NOT NULL,
      hora TEXT,
      tipo TEXT NOT NULL CHECK(tipo IN ('choque','robo','vandalismo','falla_mecanica','ponchadura','inundacion','incendio','volcadura','atropello','otro')),
      gravedad TEXT DEFAULT 'leve' CHECK(gravedad IN ('leve','moderado','grave','perdida_total')),
      descripcion TEXT NOT NULL,
      ubicacion TEXT,
      conductor_nombre TEXT,
      conductor_licencia TEXT,
      terceros_involucrados TEXT,
      numero_siniestro_aseguradora TEXT,
      folio_ministerio_publico TEXT,
      costo_estimado_danos REAL,
      fotos TEXT,
      estado TEXT DEFAULT 'reportado' CHECK(estado IN ('reportado','en_proceso','resuelto','cerrado')),
      resolucion TEXT,
      fecha_resolucion TEXT,
      observaciones TEXT,
      usuario_registro_id INTEGER REFERENCES usuarios(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ Tabla incidencias creada');

  console.log('\n🎉 Migración completada exitosamente');
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  migrate().then(() => {
    const { closeDatabase } = require('./connection');
    closeDatabase();
  }).catch(console.error);
}

module.exports = migrate;