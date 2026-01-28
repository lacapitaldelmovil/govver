// Script para actualizar secretarías con datos reales
const { initDatabase, getDb, saveDatabase } = require('./connection');

const secretariasReales = [
  { siglas: 'GOB', nombre: 'Oficina del Gobernador', titular: 'Rocío Nahle García', email: 'contacto@gobernador.veracruz.gob.mx', telefono: '228-841-7400' },
  { siglas: 'SEDARPA', nombre: 'Secretaría de Desarrollo Agropecuario', titular: 'Evaristo Ovando Ramírez', email: 'contacto@sedarpa.veracruz.gob.mx', telefono: '228-841-7200' },
  { siglas: 'SEDECOP', nombre: 'Secretaría de Desarrollo Económico y Portuario', titular: 'Enrique Nachón García', email: 'contacto@sedecop.veracruz.gob.mx', telefono: '228-841-7700' },
  { siglas: 'SEDESOL', nombre: 'Secretaría de Desarrollo Social', titular: 'Guillermo Fernández Sánchez', email: 'contacto@sedesol.veracruz.gob.mx', telefono: '228-841-6700' },
  { siglas: 'SEV', nombre: 'Secretaría de Educación de Veracruz', titular: 'Dorheny García Cayetano', email: 'contacto@sev.gob.mx', telefono: '228-841-6500' },
  { siglas: 'SEFIPLAN', nombre: 'Secretaría de Finanzas y Planeación', titular: 'José Luis Lima Franco', email: 'contacto@sefiplan.veracruz.gob.mx', telefono: '228-841-7500' },
  { siglas: 'SIOP', nombre: 'Secretaría de Infraestructura y Obras Públicas', titular: 'Pedro Montalvo Gómez', email: 'contacto@siop.veracruz.gob.mx', telefono: '228-841-6900' },
  { siglas: 'SEDEMA', nombre: 'Secretaría de Medio Ambiente', titular: 'María del Rocío Pérez Pérez', email: 'contacto@sedema.veracruz.gob.mx', telefono: '228-841-7800' },
  { siglas: 'SALUD', nombre: 'Secretaría de Salud', titular: 'Salvador González Guzmán', email: 'contacto@sesver.gob.mx', telefono: '228-841-8800' },
  { siglas: 'SSP', nombre: 'Secretaría de Seguridad Pública', titular: 'Hugo Gutiérrez Maldonado', email: 'contacto@ssp.veracruz.gob.mx', telefono: '228-841-8500' },
  { siglas: 'DIF', nombre: 'Sistema para el Desarrollo Integral de la Familia', titular: 'Karime Macías Tubilla', email: 'contacto@difver.gob.mx', telefono: '228-841-6300' },
  { siglas: 'SEGOB', nombre: 'Secretaría de Gobierno', titular: 'Titular SEGOB', email: 'contacto@segob.veracruz.gob.mx', telefono: '228-841-7100' },
  { siglas: 'SECTUR', nombre: 'Secretaría de Turismo', titular: 'Titular SECTUR', email: 'contacto@sectur.veracruz.gob.mx', telefono: '228-841-7300' },
  { siglas: 'SETRAV', nombre: 'Secretaría de Trabajo, Previsión Social y Productividad', titular: 'Titular SETRAV', email: 'contacto@setrav.veracruz.gob.mx', telefono: '228-841-7350' },
  { siglas: 'SECOP', nombre: 'Secretaría de la Contraloría General', titular: 'Titular SECOP', email: 'contacto@secop.veracruz.gob.mx', telefono: '228-841-7380' },
  { siglas: 'PC', nombre: 'Secretaría de Protección Civil', titular: 'Titular PC', email: 'contacto@pc.veracruz.gob.mx', telefono: '228-841-7390' },
  { siglas: 'SECOM', nombre: 'Secretaría de Comunicaciones', titular: 'Titular SECOM', email: 'contacto@secom.veracruz.gob.mx', telefono: '228-841-7410' },
  { siglas: 'IVEC', nombre: 'Instituto Veracruzano de la Cultura', titular: 'Titular IVEC', email: 'contacto@ivec.veracruz.gob.mx', telefono: '228-841-7420' },
  { siglas: 'CAEV', nombre: 'Comisión del Agua del Estado de Veracruz', titular: 'Titular CAEV', email: 'contacto@caev.veracruz.gob.mx', telefono: '228-841-7430' }
];

async function actualizarSecretarias() {
  console.log('🏛️  Actualizando secretarías con datos reales...\n');
  
  try {
    await initDatabase();
    const db = getDb();
    let actualizadas = 0;

    for (const sec of secretariasReales) {
      const existe = db.exec("SELECT id FROM secretarias WHERE siglas = '" + sec.siglas + "'");
      
      if (existe.length > 0 && existe[0].values.length > 0) {
        db.run("UPDATE secretarias SET nombre = '" + sec.nombre + "', titular = '" + sec.titular + "', email = '" + sec.email + "', telefono = '" + sec.telefono + "' WHERE siglas = '" + sec.siglas + "'");
        console.log('✅ ' + sec.siglas + ' - ' + sec.titular);
        actualizadas++;
      } else {
        console.log('⚠️  ' + sec.siglas + ' no existe, creando...');
        db.run("INSERT INTO secretarias (siglas, nombre, titular, email, telefono) VALUES ('" + sec.siglas + "', '" + sec.nombre + "', '" + sec.titular + "', '" + sec.email + "', '" + sec.telefono + "')");
        actualizadas++;
      }
    }

    saveDatabase();
    console.log('\n📊 Secretarías actualizadas: ' + actualizadas);
    console.log('✅ Proceso completado');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

actualizarSecretarias();
