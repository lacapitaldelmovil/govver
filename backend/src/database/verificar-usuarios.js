// Script para verificar y crear usuarios faltantes
const { initDatabase, getDb, saveDatabase } = require('./connection');
const bcrypt = require('bcryptjs');

async function verificarUsuarios() {
  await initDatabase();
  const db = getDb();
  
  // Listar todas las secretarías
  const secretarias = db.exec("SELECT id, siglas, nombre FROM secretarias ORDER BY siglas");
  console.log('\n🏛️  SECRETARÍAS EN LA BASE DE DATOS:');
  console.log('=' .repeat(60));
  
  if (secretarias.length > 0) {
    const passwordHash = bcrypt.hashSync('Veracruz2024!', 10);
    let usuariosCreados = 0;
    
    for (const row of secretarias[0].values) {
      const [id, siglas, nombre] = row;
      
      // Buscar usuario admin
      const usuarioEmail = 'admin.' + siglas.toLowerCase() + '@veracruz.gob.mx';
      const usuario = db.exec("SELECT email FROM usuarios WHERE secretaria_id = " + id + " AND rol = 'admin_secretaria'");
      
      if (usuario.length > 0 && usuario[0].values.length > 0) {
        console.log('✅ ' + siglas + ' - ' + nombre);
        console.log('   Usuario: ' + usuario[0].values[0][0]);
      } else {
        console.log('⚠️  ' + siglas + ' - ' + nombre);
        console.log('   ❌ Sin usuario admin, creando...');
        
        db.run("INSERT INTO usuarios (nombre, email, password, rol, secretaria_id, activo) VALUES ('Administrador " + siglas + "', '" + usuarioEmail + "', '" + passwordHash + "', 'admin_secretaria', " + id + ", 1)");
        console.log('   ✅ Usuario creado: ' + usuarioEmail);
        usuariosCreados++;
      }
    }
    
    if (usuariosCreados > 0) {
      saveDatabase();
      console.log('\n📊 Se crearon ' + usuariosCreados + ' usuarios adicionales');
    }
    
    console.log('\n📊 Total de secretarías: ' + secretarias[0].values.length);
  }
  
  // Listar todos los usuarios
  const usuarios = db.exec("SELECT u.email, u.rol, s.siglas FROM usuarios u LEFT JOIN secretarias s ON u.secretaria_id = s.id ORDER BY u.rol, s.siglas");
  console.log('\n👤 USUARIOS EN EL SISTEMA:');
  console.log('=' .repeat(60));
  
  if (usuarios.length > 0) {
    for (const row of usuarios[0].values) {
      console.log(row[1] + ' - ' + row[0] + (row[2] ? ' (' + row[2] + ')' : ''));
    }
  }
  
  process.exit(0);
}

verificarUsuarios();
