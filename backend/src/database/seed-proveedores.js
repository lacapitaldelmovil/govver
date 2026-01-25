/**
 * Script de seed para Proveedores
 * Carga proveedores de ejemplo
 */

const { initDatabase, query, closeDatabase } = require('./connection');

async function seedProveedores() {
  console.log('🌱 Cargando proveedores de ejemplo...\n');

  await initDatabase();

  // Obtener secretarías existentes
  const secretarias = query('SELECT id, siglas FROM secretarias WHERE activa = 1').rows;
  
  if (secretarias.length === 0) {
    console.log('❌ No hay secretarías. Ejecuta primero seed.js');
    closeDatabase();
    return;
  }

  // Proveedores de ejemplo con diferentes años de servicio
  const proveedores = [
    // DIF - Proveedores con muchos años (ejemplo que mencionaste)
    {
      nombre: 'Automotriz del Golfo S.A. de C.V.',
      rfc: 'AGO101215AB1',
      giro: 'Venta de vehículos',
      fecha_inicio: '2010-03-15',
      fecha_fin: '2020-12-31',
      secretaria_siglas: 'DIF',
      servicios: 'Venta de vehículos nuevos, camionetas y autobuses',
      monto_total_contratos: 15000000,
      numero_contratos: 8,
      contacto_nombre: 'Carlos Mendoza',
      contacto_email: 'cmendoza@autogolfo.com',
      contacto_telefono: '229 123 4567'
    },
    {
      nombre: 'Servicios Mecánicos Veracruzanos',
      rfc: 'SMV080520CD2',
      giro: 'Mantenimiento vehicular',
      fecha_inicio: '2008-05-20',
      fecha_fin: null, // Sigue activo
      secretaria_siglas: 'DIF',
      servicios: 'Mantenimiento preventivo y correctivo de vehículos',
      monto_total_contratos: 4500000,
      numero_contratos: 15,
      contacto_nombre: 'Roberto Hernández',
      contacto_email: 'rhernandez@smv.com.mx',
      contacto_telefono: '229 234 5678'
    },
    {
      nombre: 'Llantas y Refacciones del Puerto',
      rfc: 'LRP150610EF3',
      giro: 'Refacciones automotrices',
      fecha_inicio: '2015-06-10',
      fecha_fin: null,
      secretaria_siglas: 'DIF',
      servicios: 'Venta de llantas, refacciones y accesorios',
      monto_total_contratos: 2000000,
      numero_contratos: 20,
      contacto_nombre: 'María López',
      contacto_email: 'mlopez@llantaspuerto.mx',
      contacto_telefono: '229 345 6789'
    },
    
    // SSP - Seguridad Pública
    {
      nombre: 'Vehículos Blindados del Sureste',
      rfc: 'VBS120815GH4',
      giro: 'Blindaje vehicular',
      fecha_inicio: '2012-08-15',
      fecha_fin: null,
      secretaria_siglas: 'SSP',
      servicios: 'Blindaje nivel III y IV para vehículos oficiales',
      monto_total_contratos: 35000000,
      numero_contratos: 12,
      contacto_nombre: 'Arturo Ramírez',
      contacto_email: 'aramitez@vbsureste.com',
      contacto_telefono: '229 456 7890'
    },
    {
      nombre: 'Equipamiento Táctico Nacional',
      rfc: 'ETN180320IJ5',
      giro: 'Equipamiento policial',
      fecha_inicio: '2018-03-20',
      fecha_fin: null,
      secretaria_siglas: 'SSP',
      servicios: 'Equipamiento para patrullas, radios, sirenas',
      monto_total_contratos: 8000000,
      numero_contratos: 6,
      contacto_nombre: 'Fernando Torres',
      contacto_email: 'ftorres@etn.mx',
      contacto_telefono: '55 1234 5678'
    },
    
    // Salud
    {
      nombre: 'Ambulancias y Equipos Médicos S.A.',
      rfc: 'AEM051110KL6',
      giro: 'Ambulancias',
      fecha_inicio: '2005-11-10',
      fecha_fin: '2022-06-30',
      secretaria_siglas: 'SALUD',
      servicios: 'Venta y equipamiento de ambulancias',
      monto_total_contratos: 45000000,
      numero_contratos: 25,
      contacto_nombre: 'Dra. Patricia Sánchez',
      contacto_email: 'psanchez@aem.com.mx',
      contacto_telefono: '229 567 8901'
    },
    {
      nombre: 'Transporte Médico Especializado',
      rfc: 'TME200115MN7',
      giro: 'Transporte médico',
      fecha_inicio: '2020-01-15',
      fecha_fin: null,
      secretaria_siglas: 'SALUD',
      servicios: 'Vehículos adaptados para traslado de pacientes',
      monto_total_contratos: 5000000,
      numero_contratos: 3,
      contacto_nombre: 'Dr. Manuel Vargas',
      contacto_email: 'mvargas@tme.mx',
      contacto_telefono: '229 678 9012'
    },
    
    // Educación
    {
      nombre: 'Autobuses Escolares de México',
      rfc: 'AEM140225OP8',
      giro: 'Autobuses escolares',
      fecha_inicio: '2014-02-25',
      fecha_fin: null,
      secretaria_siglas: 'SEV',
      servicios: 'Venta y mantenimiento de autobuses escolares',
      monto_total_contratos: 28000000,
      numero_contratos: 10,
      contacto_nombre: 'Ing. Jorge Díaz',
      contacto_email: 'jdiaz@aemex.com',
      contacto_telefono: '229 789 0123'
    },
    
    // SEDARPA
    {
      nombre: 'Tractores y Maquinaria Agrícola',
      rfc: 'TMA110530QR9',
      giro: 'Maquinaria agrícola',
      fecha_inicio: '2011-05-30',
      fecha_fin: null,
      secretaria_siglas: 'SEDARPA',
      servicios: 'Tractores, implementos agrícolas y refacciones',
      monto_total_contratos: 22000000,
      numero_contratos: 18,
      contacto_nombre: 'Alejandro Moreno',
      contacto_email: 'amoreno@tmamexico.com',
      contacto_telefono: '229 890 1234'
    },
    {
      nombre: 'Combustibles y Lubricantes del Campo',
      rfc: 'CLC160815ST0',
      giro: 'Combustibles',
      fecha_inicio: '2016-08-15',
      fecha_fin: null,
      secretaria_siglas: 'SEDARPA',
      servicios: 'Diésel, gasolina y lubricantes para maquinaria',
      monto_total_contratos: 12000000,
      numero_contratos: 50,
      contacto_nombre: 'Ricardo Fuentes',
      contacto_email: 'rfuentes@clc.mx',
      contacto_telefono: '229 901 2345'
    },
    
    // Gobernación
    {
      nombre: 'Flotas Ejecutivas de Veracruz',
      rfc: 'FEV090120UV1',
      giro: 'Vehículos ejecutivos',
      fecha_inicio: '2009-01-20',
      fecha_fin: null,
      secretaria_siglas: 'GOBERNACIÓN',
      servicios: 'Vehículos ejecutivos, sedanes de lujo',
      monto_total_contratos: 55000000,
      numero_contratos: 30,
      contacto_nombre: 'Lic. Ana García',
      contacto_email: 'agarcia@fev.com.mx',
      contacto_telefono: '229 012 3456'
    },
    {
      nombre: 'Mantenimiento Automotriz Premium',
      rfc: 'MAP170405WX2',
      giro: 'Mantenimiento especializado',
      fecha_inicio: '2017-04-05',
      fecha_fin: null,
      secretaria_siglas: 'GOBERNACIÓN',
      servicios: 'Mantenimiento premium para vehículos oficiales',
      monto_total_contratos: 8500000,
      numero_contratos: 40,
      contacto_nombre: 'Ing. Pablo Ruiz',
      contacto_email: 'pruiz@mappremium.mx',
      contacto_telefono: '229 123 4567'
    },
    
    // SIOP
    {
      nombre: 'Maquinaria Pesada del Golfo',
      rfc: 'MPG070810YZ3',
      giro: 'Maquinaria pesada',
      fecha_inicio: '2007-08-10',
      fecha_fin: null,
      secretaria_siglas: 'SIOP',
      servicios: 'Retroexcavadoras, bulldozers, grúas',
      monto_total_contratos: 85000000,
      numero_contratos: 22,
      contacto_nombre: 'Ing. Luis Martínez',
      contacto_email: 'lmartinez@mpgolfo.com',
      contacto_telefono: '229 234 5678'
    }
  ];

  let insertados = 0;

  for (const prov of proveedores) {
    // Buscar la secretaría por siglas
    const secretaria = secretarias.find(s => s.siglas === prov.secretaria_siglas);
    if (!secretaria) {
      console.log(`⚠️ Secretaría ${prov.secretaria_siglas} no encontrada, saltando proveedor ${prov.nombre}`);
      continue;
    }

    try {
      query(
        `INSERT INTO proveedores (
          nombre, rfc, contacto_nombre, contacto_email, contacto_telefono,
          direccion, giro, fecha_inicio, fecha_fin, secretaria_id,
          servicios, monto_total_contratos, numero_contratos, calificacion, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prov.nombre,
          prov.rfc,
          prov.contacto_nombre || null,
          prov.contacto_email || null,
          prov.contacto_telefono || null,
          prov.direccion || 'Veracruz, Ver.',
          prov.giro,
          prov.fecha_inicio,
          prov.fecha_fin,
          secretaria.id,
          prov.servicios,
          prov.monto_total_contratos || 0,
          prov.numero_contratos || 0,
          Math.floor(Math.random() * 3) + 3, // Calificación entre 3 y 5
          null
        ]
      );
      insertados++;
    } catch (error) {
      console.error(`Error insertando ${prov.nombre}:`, error.message);
    }
  }

  console.log(`✅ ${insertados} proveedores insertados`);
  closeDatabase();

  console.log('\n🎉 Carga de proveedores completada exitosamente');
}

seedProveedores().catch(console.error);
