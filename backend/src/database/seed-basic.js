/**
 * Seed básico - Crea secretaría DIF y usuario admin
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
