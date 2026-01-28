// Script para activar todas las secretarías
const { initDatabase, getDb, saveDatabase } = require('./connection');

async function fixSecretariasActiva() {
  console.log('🔧 Activando todas las secretarías...\n');
  
  try {
    await initDatabase();
    const db = getDb();
    
    // Verificar si existe la columna activa
    try {
      db.run("ALTER TABLE secretarias ADD COLUMN activa INTEGER DEFAULT 1");
      console.log('✅ Columna activa agregada');
    } catch (e) {
      console.log('ℹ️  Columna activa ya existe');
    }
    
    // Activar todas las secretarías
    db.run("UPDATE secretarias SET activa = 1");
    console.log('✅ Todas las secretarías activadas');
    
    // Verificar
    const result = db.exec("SELECT siglas, nombre, activa FROM secretarias ORDER BY siglas");
    console.log('\n📋 Secretarías en la base de datos:');
    if (result.length > 0) {
      for (const row of result[0].values) {
        console.log('  ' + (row[2] === 1 ? '✅' : '❌') + ' ' + row[0] + ' - ' + row[1]);
      }
      console.log('\n📊 Total: ' + result[0].values.length + ' secretarías');
    }
    
    saveDatabase();
    console.log('\n✅ Proceso completado');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSecretariasActiva();
