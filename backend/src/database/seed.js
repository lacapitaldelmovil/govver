/**
 * Script de datos de ejemplo - Datos ficticios basados en estructura del Excel
 */

const bcrypt = require('bcryptjs');
const { initDatabase, query, closeDatabase } = require('./connection');

async function seed() {
  console.log('🌱 Iniciando carga de datos de ejemplo...\n');

  await initDatabase();

  // Dependencias del Estado de Veracruz
  const dependencias = [
    { 
      siglas: 'GOB', 
      nombre: 'Oficina del Gobernador', 
      titular: 'Rocío Nahle García',
      email: 'contacto@gobernador.veracruz.gob.mx',
      telefono: '228-841-7400',
      direccion: 'Palacio de Gobierno, Xalapa, Ver.'
    },
    { 
      siglas: 'SEFIPLAN', 
      nombre: 'Secretaría de Finanzas y Planeación', 
      titular: 'José Luis Lima Franco',
      email: 'contacto@sefiplan.veracruz.gob.mx',
      telefono: '228-841-7500',
      direccion: 'Torre Administrativo, Xalapa, Ver.'
    },
    { 
      siglas: 'SSP', 
      nombre: 'Secretaría de Seguridad Pública', 
      titular: 'Hugo Gutiérrez Maldonado',
      email: 'contacto@ssp.veracruz.gob.mx',
      telefono: '228-841-8500',
      direccion: 'Centro de Coordinación de Seguridad, Xalapa, Ver.'
    },
    { 
      siglas: 'SALUD', 
      nombre: 'Secretaría de Salud', 
      titular: 'Salvador González Guzmán',
      email: 'contacto@sesver.gob.mx',
      telefono: '228-841-8800',
      direccion: 'Av. Lázaro Cárdenas, Xalapa, Ver.'
    },
    { 
      siglas: 'SEV', 
      nombre: 'Secretaría de Educación de Veracruz', 
      titular: 'Dorheny García Cayetano',
      email: 'contacto@sev.gob.mx',
      telefono: '228-841-6500',
      direccion: 'Km. 4.5 Carretera Xalapa-Veracruz, Xalapa, Ver.'
    },
    { 
      siglas: 'SEDECOP', 
      nombre: 'Secretaría de Desarrollo Económico y Portuario', 
      titular: 'Enrique Nachón García',
      email: 'contacto@sedecop.veracruz.gob.mx',
      telefono: '228-841-7700',
      direccion: 'Edificio Torre Ánimas, Xalapa, Ver.'
    },
    { 
      siglas: 'SEDESOL', 
      nombre: 'Secretaría de Desarrollo Social', 
      titular: 'Guillermo Fernández Sánchez',
      email: 'contacto@sedesol.veracruz.gob.mx',
      telefono: '228-841-6700',
      direccion: 'Av. Circuito Presidentes, Xalapa, Ver.'
    },
    { 
      siglas: 'SIOP', 
      nombre: 'Secretaría de Infraestructura y Obras Públicas', 
      titular: 'Pedro Montalvo Gómez',
      email: 'contacto@siop.veracruz.gob.mx',
      telefono: '228-841-6900',
      direccion: 'Libramiento Norte, Xalapa, Ver.'
    },
    { 
      siglas: 'SEDEMA', 
      nombre: 'Secretaría de Medio Ambiente', 
      titular: 'María del Rocío Pérez Pérez',
      email: 'contacto@sedema.veracruz.gob.mx',
      telefono: '228-841-7800',
      direccion: 'Av. Lázaro Cárdenas, Xalapa, Ver.'
    },
    { 
      siglas: 'SEDARPA', 
      nombre: 'Secretaría de Desarrollo Agropecuario', 
      titular: 'Evaristo Ovando Ramírez',
      email: 'contacto@sedarpa.veracruz.gob.mx',
      telefono: '228-841-7200',
      direccion: 'Carretera Federal Xalapa-Veracruz, Xalapa, Ver.'
    },
    { 
      siglas: 'DIF', 
      nombre: 'Sistema para el Desarrollo Integral de la Familia', 
      titular: 'Karime Macías Tubilla',
      email: 'contacto@difver.gob.mx',
      telefono: '228-841-6300',
      direccion: 'Av. Xalapa No. 325, Col. Obrero Campesina, Xalapa, Ver.'
    }
  ];

  for (const dep of dependencias) {
    try {
      query(`INSERT INTO secretarias (siglas, nombre, titular, email, telefono, direccion, activa) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [dep.siglas, dep.nombre, dep.titular, dep.email, dep.telefono, dep.direccion]);
    } catch (e) {}
  }
  console.log(`✅ ${dependencias.length} dependencias insertadas`);

  // Usuarios
  const usuarios = [
    // ========== NIVEL 1: SUPER ADMIN ==========
    { 
      email: 'superadmin@veracruz.gob.mx', 
      nombre: 'Super Administrador', 
      rol: 'admin', 
      password: 'Admin2024!',
      cargo: 'Administrador del Sistema',
      secretaria_id: null 
    },

    // ========== NIVEL 2: GOBERNACIÓN ==========
    { 
      email: 'gobernadora@veracruz.gob.mx', 
      nombre: 'Rocío Nahle García', 
      rol: 'gobernacion', 
      password: 'Gobernacion2024!',
      cargo: 'Gobernadora del Estado',
      secretaria_id: 1 // GOB
    },
    { 
      email: 'secretario.particular@veracruz.gob.mx', 
      nombre: 'Secretario Particular', 
      rol: 'gobernacion', 
      password: 'Gobernacion2024!',
      cargo: 'Secretario Particular de Gobernación',
      secretaria_id: 1 // GOB
    },

    // ========== NIVEL 3: ADMIN POR SECRETARÍA (10 Secretarías) ==========
    // 1. SEFIPLAN
    { 
      email: 'admin.sefiplan@veracruz.gob.mx', 
      nombre: 'Coordinador SEFIPLAN', 
      rol: 'admin_secretaria', 
      password: 'Sefiplan2024!',
      cargo: 'Coordinador de Flota SEFIPLAN',
      secretaria_id: 2
    },
    // 2. SSP
    { 
      email: 'admin.ssp@veracruz.gob.mx', 
      nombre: 'Coordinador SSP', 
      rol: 'admin_secretaria', 
      password: 'Ssp2024!',
      cargo: 'Coordinador de Flota SSP',
      secretaria_id: 3
    },
    // 3. SALUD
    { 
      email: 'admin.salud@veracruz.gob.mx', 
      nombre: 'Coordinador Salud', 
      rol: 'admin_secretaria', 
      password: 'Salud2024!',
      cargo: 'Coordinador de Flota Salud',
      secretaria_id: 4
    },
    // 4. SEV
    { 
      email: 'admin.sev@veracruz.gob.mx', 
      nombre: 'Coordinador SEV', 
      rol: 'admin_secretaria', 
      password: 'Sev2024!',
      cargo: 'Coordinador de Flota SEV',
      secretaria_id: 5
    },
    // 5. SEDECOP
    { 
      email: 'admin.sedecop@veracruz.gob.mx', 
      nombre: 'Coordinador SEDECOP', 
      rol: 'admin_secretaria', 
      password: 'Sedecop2024!',
      cargo: 'Coordinador de Flota SEDECOP',
      secretaria_id: 6
    },
    // 6. SEDESOL
    { 
      email: 'admin.sedesol@veracruz.gob.mx', 
      nombre: 'Coordinador SEDESOL', 
      rol: 'admin_secretaria', 
      password: 'Sedesol2024!',
      cargo: 'Coordinador de Flota SEDESOL',
      secretaria_id: 7
    },
    // 7. SIOP
    { 
      email: 'admin.siop@veracruz.gob.mx', 
      nombre: 'Coordinador SIOP', 
      rol: 'admin_secretaria', 
      password: 'Siop2024!',
      cargo: 'Coordinador de Flota SIOP',
      secretaria_id: 8
    },
    // 8. SEDEMA
    { 
      email: 'admin.sedema@veracruz.gob.mx', 
      nombre: 'Coordinador SEDEMA', 
      rol: 'admin_secretaria', 
      password: 'Sedema2024!',
      cargo: 'Coordinador de Flota SEDEMA',
      secretaria_id: 9
    },
    // 9. SEDARPA
    { 
      email: 'admin.sedarpa@veracruz.gob.mx', 
      nombre: 'Coordinador SEDARPA', 
      rol: 'admin_secretaria', 
      password: 'Sedarpa2024!',
      cargo: 'Coordinador de Flota SEDARPA',
      secretaria_id: 10
    },
    // 10. DIF
    { 
      email: 'admin.dif@veracruz.gob.mx', 
      nombre: 'Coordinador DIF', 
      rol: 'admin_secretaria', 
      password: 'Dif2024!',
      cargo: 'Coordinador de Flota DIF',
      secretaria_id: 11
    },

    // ========== NIVEL 4: CONDUCTORES ==========
    { 
      email: 'conductor1@veracruz.gob.mx', 
      nombre: 'Juan Pérez López', 
      rol: 'conductor', 
      password: 'Conductor2024!',
      cargo: 'Conductor',
      secretaria_id: 2 // SEFIPLAN
    },
    { 
      email: 'conductor2@veracruz.gob.mx', 
      nombre: 'María González Hernández', 
      rol: 'conductor', 
      password: 'Conductor2024!',
      cargo: 'Conductor',
      secretaria_id: 3 // SSP
    },
    { 
      email: 'conductor3@veracruz.gob.mx', 
      nombre: 'Carlos Martínez Ruiz', 
      rol: 'conductor', 
      password: 'Conductor2024!',
      cargo: 'Conductor',
      secretaria_id: 4 // SALUD
    }
  ];

  for (const usr of usuarios) {
    try {
      const hash = bcrypt.hashSync(usr.password, 10);
      query(`INSERT INTO usuarios (email, password, nombre, rol, cargo, secretaria_id, activo) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [usr.email.toLowerCase(), hash, usr.nombre, usr.rol, usr.cargo, usr.secretaria_id]);
    } catch (e) {
      console.error(`Error insertando ${usr.email}:`, e.message);
    }
  }
  console.log(`✅ ${usuarios.length} usuarios insertados`);

  // Vehículos de ejemplo
  const marcas = ['Chevrolet', 'Nissan', 'Ford', 'Toyota', 'Volkswagen', 'Honda', 'Dodge', 'Jeep'];
  const modelos = ['Aveo', 'Tsuru', 'F-150', 'Hilux', 'Jetta', 'CR-V', 'Durango', 'Grand Cherokee'];
  const tipos = ['sedan', 'pickup', 'suv', 'camioneta', 'van'];
  const estadosOp = ['Operando', 'Operando', 'Operando', 'En taller', 'Mal estado'];
  const regimenes = ['Propio', 'Propio', 'Propio', 'Arrendado', 'Comodato'];
  const municipios = ['Xalapa', 'Veracruz', 'Boca del Río', 'Coatzacoalcos', 'Córdoba', 'Orizaba', 'Poza Rica'];

  // Obtener IDs de secretarías
  const secretarias = query('SELECT id, siglas FROM secretarias').rows;

  let vehiculosInsertados = 0;
  for (let i = 1; i <= 100; i++) {
    const sec = secretarias[Math.floor(Math.random() * secretarias.length)];
    const marcaIdx = Math.floor(Math.random() * marcas.length);
    
    try {
      query(`
        INSERT INTO vehiculos (
          numero_inventario, numero_economico, placas, numero_serie,
          descripcion, marca, modelo, anio, color, tipo,
          valor_libros, ubicacion_fisica, municipio, secretaria_id, area_responsable,
          tarjeta_circulacion, estado_operativo, estatus, kilometraje,
          seguro, regimen, proveedor_arrendadora, renta_mensual,
          resguardante_nombre, resguardante_cargo, observaciones, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        `INV-2024-${String(i).padStart(4, '0')}`,
        `ECO-${String(i).padStart(3, '0')}`,
        `YEE-${String(100 + i).padStart(3, '0')}-A`,
        `3G1TC5CF${String(Math.floor(Math.random() * 900000000 + 100000000))}`,
        `${marcas[marcaIdx]} ${modelos[marcaIdx]} ${2018 + Math.floor(Math.random() * 7)}`,
        marcas[marcaIdx],
        modelos[marcaIdx],
        2018 + Math.floor(Math.random() * 7),
        ['Blanco', 'Negro', 'Gris', 'Rojo', 'Azul'][Math.floor(Math.random() * 5)],
        tipos[Math.floor(Math.random() * tipos.length)],
        150000 + Math.floor(Math.random() * 500000),
        `Edificio ${sec.siglas}`,
        municipios[Math.floor(Math.random() * municipios.length)],
        sec.id,
        `Coordinación Administrativa ${sec.siglas}`,
        ['Vigente', 'Vigente', 'Vigente', 'No vigente'][Math.floor(Math.random() * 4)],
        estadosOp[Math.floor(Math.random() * estadosOp.length)],
        ['Bueno', 'Bueno', 'Regular', 'Malo'][Math.floor(Math.random() * 4)],
        Math.floor(Math.random() * 150000),
        ['Vigente', 'Vigente', 'No vigente'][Math.floor(Math.random() * 3)],
        regimenes[Math.floor(Math.random() * regimenes.length)],
        i % 5 === 0 ? 'Arrendadora del Golfo SA de CV' : null,
        i % 5 === 0 ? 8500 + Math.floor(Math.random() * 5000) : null,
        `Lic. Resguardante ${i}`,
        'Coordinador Administrativo',
        null
      ]);
      vehiculosInsertados++;
    } catch (e) {
      console.error(`Error en vehículo ${i}:`, e.message);
    }
  }
  console.log(`✅ ${vehiculosInsertados} vehículos insertados`);

  closeDatabase();

  console.log('\n🎉 Carga de datos completada exitosamente');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Email: admin@veracruz.gob.mx');
  console.log('   Contraseña: Veracruz2024!');
}

seed().catch(console.error);
