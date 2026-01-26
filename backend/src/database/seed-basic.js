/**
 * Seed básico - Crea secretaría DIF, otras secretarías y vehículos demo
 * Se ejecuta automáticamente si no hay tablas
 */

const { query } = require('./connection');
const bcrypt = require('bcryptjs');

async function seedBasic() {
  console.log('🌱 Iniciando seed básico...\n');

  // Crear secretaría DIF
  query(`
    INSERT OR IGNORE INTO secretarias (nombre, siglas, titular, email, activa)
    VALUES ('Sistema para el Desarrollo Integral de la Familia', 'DIF', 'Dirección General', 'dif@veracruz.gob.mx', 1)
  `);
  console.log('✅ Secretaría DIF creada');

  // Crear otras secretarías para préstamos
  const otrasSecretarias = [
    { nombre: 'Oficina del Gobernador', siglas: 'GOB', titular: 'Rocío Nahle García' },
    { nombre: 'Secretaría de Finanzas y Planeación', siglas: 'SEFIPLAN', titular: 'Director Finanzas' },
    { nombre: 'Secretaría de Seguridad Pública', siglas: 'SSP', titular: 'Director Seguridad' },
    { nombre: 'Secretaría de Salud', siglas: 'SALUD', titular: 'Director Salud' },
    { nombre: 'Secretaría de Educación de Veracruz', siglas: 'SEV', titular: 'Director Educación' }
  ];

  otrasSecretarias.forEach(sec => {
    try {
      query(`INSERT OR IGNORE INTO secretarias (nombre, siglas, titular, email, activa) VALUES (?, ?, ?, ?, 1)`,
        [sec.nombre, sec.siglas, sec.titular, `${sec.siglas.toLowerCase()}@veracruz.gob.mx`]);
    } catch(e) {}
  });
  console.log('✅ Otras secretarías creadas');

  // Obtener IDs de secretarías
  const secs = query("SELECT id, siglas FROM secretarias WHERE siglas IN ('GOB', 'SEFIPLAN', 'SSP', 'SALUD', 'SEV')").rows;
  const secMap = {};
  secs.forEach(s => secMap[s.siglas] = s.id);

  // Crear vehículos demo para otras secretarías (para pruebas de préstamos)
  const vehiculosDemo = [
    { sec: 'GOB', marca: 'LINCOLN', modelo: 'NAVIGATOR', anio: 2024, placas: 'GOB-001', tipo: 'camioneta' },
    { sec: 'GOB', marca: 'CHEVROLET', modelo: 'SUBURBAN', anio: 2023, placas: 'GOB-002', tipo: 'camioneta' },
    { sec: 'SEFIPLAN', marca: 'TOYOTA', modelo: 'CAMRY', anio: 2022, placas: 'SEF-001', tipo: 'sedan' },
    { sec: 'SEFIPLAN', marca: 'NISSAN', modelo: 'SENTRA', anio: 2021, placas: 'SEF-002', tipo: 'sedan' },
    { sec: 'SSP', marca: 'DODGE', modelo: 'RAM 2500', anio: 2023, placas: 'SSP-001', tipo: 'pickup' },
    { sec: 'SSP', marca: 'FORD', modelo: 'F-150', anio: 2022, placas: 'SSP-002', tipo: 'pickup' },
    { sec: 'SALUD', marca: 'NISSAN', modelo: 'NP300', anio: 2021, placas: 'SAL-001', tipo: 'pickup' },
    { sec: 'SALUD', marca: 'TOYOTA', modelo: 'HIACE', anio: 2020, placas: 'SAL-002', tipo: 'van' },
    { sec: 'SEV', marca: 'VOLKSWAGEN', modelo: 'VENTO', anio: 2022, placas: 'SEV-001', tipo: 'sedan' },
    { sec: 'SEV', marca: 'NISSAN', modelo: 'URVAN', anio: 2021, placas: 'SEV-002', tipo: 'van' }
  ];

  vehiculosDemo.forEach(v => {
    const secId = secMap[v.sec];
    if (secId) {
      try {
        // Verificar si ya existe
        const existe = query("SELECT id FROM vehiculos WHERE placas = ?", [v.placas]);
        if (existe.rows.length === 0) {
          query(`INSERT INTO vehiculos (secretaria_id, marca, modelo, anio, placas, tipo, color, estado_operativo, estatus, activo, numero_economico)
                 VALUES (?, ?, ?, ?, ?, ?, 'Blanco', 'Operando', 'Bueno', 1, ?)`,
            [secId, v.marca, v.modelo, v.anio, v.placas, v.tipo, v.placas]);
          console.log('   ➕ Vehículo creado:', v.placas);
        }
      } catch(e) {
        console.log('   ⚠️ Error creando vehículo', v.placas, e.message);
      }
    }
  });
  console.log('✅ Vehículos demo para préstamos verificados');

  // Obtener ID de la secretaría DIF
  const difResult = query("SELECT id FROM secretarias WHERE siglas = 'DIF'");
  const difId = difResult.rows[0]?.id || 1;

  // Crear usuario administrador
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  try {
    query(`
      INSERT INTO usuarios (email, password, nombre, rol, secretaria_id, cargo, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['admin.dif@veracruz.gob.mx', passwordHash, 'Administrador DIF', 'admin', difId, 'Administrador del Sistema', 1]);
    console.log('✅ Usuario admin creado');
    console.log('   📧 Email: admin.dif@veracruz.gob.mx');
    console.log('   🔑 Password: admin123');
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      console.log('ℹ️ Usuario admin ya existe');
    } else {
      throw e;
    }
  }

  console.log('\n🎉 Seed básico completado');
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  const { initDatabase, closeDatabase } = require('./connection');
  initDatabase().then(() => {
    return seedBasic();
  }).then(() => {
    closeDatabase();
  }).catch(console.error);
}

module.exports = seedBasic;
