// Script para agregar las 19 secretarías de Veracruz y crear usuarios
const { initDatabase, getDb, saveDatabase } = require('./connection');
const bcrypt = require('bcryptjs');

const secretariasVeracruz = [
  { siglas: 'GOB', nombre: 'Oficina del Gobernador', titular: 'Rocío Nahle García', email: 'gobernador@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Palacio de Gobierno, Xalapa, Ver.' },
  { siglas: 'SEGOB', nombre: 'Secretaría de Gobierno', titular: 'Titular SEGOB', email: 'segob@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SEFIPLAN', nombre: 'Secretaría de Finanzas y Planeación', titular: 'Titular SEFIPLAN', email: 'sefiplan@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SSP', nombre: 'Secretaría de Seguridad Pública', titular: 'Titular SSP', email: 'ssp@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SALUD', nombre: 'Secretaría de Salud', titular: 'Titular SALUD', email: 'salud@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SEV', nombre: 'Secretaría de Educación de Veracruz', titular: 'Titular SEV', email: 'sev@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SEDECOP', nombre: 'Secretaría de Desarrollo Económico y Portuario', titular: 'Titular SEDECOP', email: 'sedecop@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SEDESOL', nombre: 'Secretaría de Desarrollo Social', titular: 'Titular SEDESOL', email: 'sedesol@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SIOP', nombre: 'Secretaría de Infraestructura y Obras Públicas', titular: 'Titular SIOP', email: 'siop@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SEDEMA', nombre: 'Secretaría de Medio Ambiente', titular: 'Titular SEDEMA', email: 'sedema@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SEDARPA', nombre: 'Secretaría de Desarrollo Agropecuario, Rural y Pesca', titular: 'Titular SEDARPA', email: 'sedarpa@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SECTUR', nombre: 'Secretaría de Turismo', titular: 'Titular SECTUR', email: 'sectur@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SETRAV', nombre: 'Secretaría de Trabajo, Previsión Social y Productividad', titular: 'Titular SETRAV', email: 'setrav@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SECOP', nombre: 'Secretaría de la Contraloría General', titular: 'Titular SECOP', email: 'secop@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'PC', nombre: 'Secretaría de Protección Civil', titular: 'Titular PC', email: 'pc@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'SECOM', nombre: 'Secretaría de Comunicaciones', titular: 'Titular SECOM', email: 'secom@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'IVEC', nombre: 'Instituto Veracruzano de la Cultura', titular: 'Titular IVEC', email: 'ivec@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'DIF', nombre: 'Sistema DIF Estatal Veracruz', titular: 'Titular DIF', email: 'dif@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' },
  { siglas: 'CAEV', nombre: 'Comisión del Agua del Estado de Veracruz', titular: 'Titular CAEV', email: 'caev@veracruz.gob.mx', telefono: '228-842-0500', direccion: 'Xalapa, Ver.' }
];

async function addSecretariasVeracruz() {
  console.log('🏛️  Agregando las 19 secretarías de Veracruz...');
  
  try {
    await initDatabase();
    const db = getDb();
    const passwordHash = bcrypt.hashSync('Veracruz2024!', 10);
    let agregadas = 0;
    let usuariosCreados = 0;

    for (const sec of secretariasVeracruz) {
      const existe = db.exec("SELECT id FROM secretarias WHERE siglas = '" + sec.siglas + "'");
      
      if (existe.length === 0 || existe[0].values.length === 0) {
        db.run("INSERT INTO secretarias (siglas, nombre, titular, email, telefono, direccion) VALUES ('" + sec.siglas + "', '" + sec.nombre + "', '" + sec.titular + "', '" + sec.email + "', '" + sec.telefono + "', '" + sec.direccion + "')");
        
        const secIdResult = db.exec("SELECT id FROM secretarias WHERE siglas = '" + sec.siglas + "'");
        const secretariaId = secIdResult[0].values[0][0];
        
        console.log('✅ Secretaría agregada: ' + sec.siglas + ' - ' + sec.nombre);
        agregadas++;

        const usuarioEmail = 'admin.' + sec.siglas.toLowerCase() + '@veracruz.gob.mx';
        const existeUsuario = db.exec("SELECT id FROM usuarios WHERE email = '" + usuarioEmail + "'");
        
        if (existeUsuario.length === 0 || existeUsuario[0].values.length === 0) {
          db.run("INSERT INTO usuarios (nombre, email, password, rol, secretaria_id, activo) VALUES ('Administrador " + sec.siglas + "', '" + usuarioEmail + "', '" + passwordHash + "', 'admin_secretaria', " + secretariaId + ", 1)");
          console.log('   👤 Usuario creado: ' + usuarioEmail);
          usuariosCreados++;
        }
      } else {
        console.log('⏭️  Secretaría ya existe: ' + sec.siglas);
        
        // Verificar si existe usuario admin para esta secretaría
        const secIdResult = db.exec("SELECT id FROM secretarias WHERE siglas = '" + sec.siglas + "'");
        if (secIdResult.length > 0 && secIdResult[0].values.length > 0) {
          const secretariaId = secIdResult[0].values[0][0];
          const usuarioEmail = 'admin.' + sec.siglas.toLowerCase() + '@veracruz.gob.mx';
          const existeUsuario = db.exec("SELECT id FROM usuarios WHERE email = '" + usuarioEmail + "'");
          
          if (existeUsuario.length === 0 || existeUsuario[0].values.length === 0) {
            db.run("INSERT INTO usuarios (nombre, email, password, rol, secretaria_id, activo) VALUES ('Administrador " + sec.siglas + "', '" + usuarioEmail + "', '" + passwordHash + "', 'admin_secretaria', " + secretariaId + ", 1)");
            console.log('   👤 Usuario creado: ' + usuarioEmail);
            usuariosCreados++;
          }
        }
      }
    }

    saveDatabase();
    console.log('\n📊 Resumen:');
    console.log('   - Secretarías agregadas: ' + agregadas);
    console.log('   - Usuarios creados: ' + usuariosCreados);
    console.log('   - Contraseña para todos: Veracruz2024!');
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addSecretariasVeracruz();
