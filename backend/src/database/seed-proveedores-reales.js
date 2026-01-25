/**
 * Script para crear proveedores reales desde los datos de vehículos
 * Normaliza los nombres de proveedores y cuenta vehículos por cada uno
 */

const { initDatabase, query, closeDatabase } = require('./connection');

async function crearProveedoresReales() {
  console.log('🔄 Creando proveedores reales desde datos de vehículos...\n');
  
  await initDatabase();
  
  // Limpiar proveedores anteriores
  query('DELETE FROM proveedores');
  console.log('✓ Proveedores anteriores eliminados');
  
  // Obtener ID del DIF
  const dif = query('SELECT id FROM secretarias WHERE siglas = ?', ['DIF']);
  const difId = dif.rows[0].id;
  
  // Proveedores principales normalizados con sus variantes de escritura
  const proveedoresMap = {
    'ADAMED, S.A. DE C.V.': ['ADAMED', 'ADAME'],
    'CUERNAVACA AUTOMOTRIZ, S.A. DE C.V.': ['CUERNAVACA AUTOMOTRIZ', 'CUERNAVACA AOTOMOTRIZ', 'CUERNAVACA AUTMOTRIZ', 'CUERNAVCA'],
    'CAR ONE AMERICANA, S.A. DE C.V.': ['CAR ONE AMERICANA', 'CAR ONE AMERTICANA'],
    'UNINDUSTRIAS, S.A. DE C.V.': ['UNINDUSTRIAS', 'UNIINDUSTRIAS', 'UNINDUSTRIA'],
    'HELITAFE': ['HELITAFE'],
    '399 PROYECT DEVELOPMENT, S.A. DE C.V.': ['399 PROYECT', 'PROYECT DEVELOPMENT', 'PROJECT DEVELOPMENT'],
    'AKTUELLE, S.A. DE C.V.': ['AKTUELLE'],
    'DINA COMERCIALIZACION AUTOMOTRIZ, S.A. DE C.V.': ['DINA COMERCIALIZA', 'DINA COMERCIALIZACION'],
    'MARISCAL MOTORS, S.A. DE C.V.': ['MARISCAL MOTORS'],
    'EUROFRANCE, S.A. DE C.V.': ['EUROFRANCE', 'EUFRANCE', 'WUFRANCE'],
    'DIEZ ORIZABA, S.A. DE C.V.': ['DIEZ ORIZABA'],
    'VEHICULOS PERFECTOS, S.A. DE C.V.': ['VEHICULOS PERFECTOS'],
    'SHINYU AUTOMOTRIZ, S.A. DE C.V.': ['SHINYU', 'SHIINYU'],
    'SAMURAI MOTORS XALAPA, S. DE R.L. DE C.V.': ['SAMURAI MOTORS', 'SAMURAI MOTROS'],
    'BARUQUI MOTORS, S.A. DE C.V.': ['BARUQUI'],
    'SUPER MOTORS, S.A. DE C.V.': ['SUPER MOTORS'],
    'SABALO DE XALAPA, S.A. DE C.V.': ['SABALO DE XALAPA'],
    'GOMSA AUTOMOTRIZ, S.A. DE C.V.': ['GOMSA AUTOMOTRIZ', 'GOMSA CAMIONES'],
    'COUNTRY MOTORS, S.A. DE C.V.': ['COUNTRY MOTORS'],
    'CONSORCIO PEREDO, S.A. DE C.V.': ['CONSORCIO PEREDO'],
    'AUTOMOVILISTICA VERACRUZANA, S.A. DE C.V.': ['AUTOMOVILISTICA VERACRUZANA', 'AUTOMOVILISTICA VERARUZANA'],
    'AUTOMOTRIZ DEL PAPALOAPAN, S.A. DE C.V.': ['AUTOMOTRIZ DEL PAPALOAPAN'],
    'AUTOMOTORES ANTEQUERA, S.A. DE C.V.': ['AUTOMOTORES ANTEQUERA'],
    'AUTO DIEZ VERACRUZ, S.A. DE C.V.': ['AUTO DIEZ VERACRUZ'],
    'AMBULANCE NETWORK, INC': ['AMBULANCE NETWORK'],
    'ARRENDADORA DEL GOLFO, S.A. DE C.V.': ['ARRENDADORA DEL GOLFO'],
    'LUX MOTORS VERACRUZ, S.A. DE C.V.': ['LUX MOTORS'],
    'SUPER AUTOS JALAPA, S.A. DE C.V.': ['SUPER AUTOS JALAPA', 'AUPER AUTOS JALAPA'],
    'IMPERIO AUTOMOTRIZ DE VERACRUZ, S.A. DE C.V.': ['IMPERIO AUTOMOTRIZ'],
    'JUAN OSORIO LOPEZ AUTOS MINATITLAN, S.A. DE C.V.': ['JUAN OSORIO', 'JUANOSORIO'],
    'VILLAAUTOS, S.A. DE C.V.': ['VILLAAUTOS'],
    'TLAHUAC MOTORS, S.A. DE C.V.': ['TLAHUAC MOTORS'],
    'THE ANGLO MEXICAN MOTOR CO., S.A. DE C.V.': ['THE ANGLO MEXICAN'],
    'KASTRO AUTOMOTRIZ, S.A. DE C.V.': ['KASTRO AUTOMOTRIZ'],
    'GRUPO VAFE': ['GRUPO VAFE'],
    'CENTRO DE FORMACION TACTICA INTEGRAL, S.A. DE C.V.': ['CENTRO DE FORMACION TACTICA'],
    'ANDRADE TLALPAN, S.A. DE C.V.': ['ANDRADE TLALPAN'],
    'AUTO IDEAL, S.A. DE C.V.': ['AUTO IDEAL'],
    'AUTOMOTORES TUXPAN, S.A. DE C.V.': ['AUTOMOTORES TUXPAN'],
    'PANDAL MOTORES, S.A. DE C.V.': ['PANDAL MOTORES'],
    'PERALES AUTOMOTRIZ, S.A. DE C.V.': ['PERALES AUTOMOTRIZ'],
    'REFORMA MOTORS, S.A. DE C.V.': ['REFORMA MOTORS'],
    'REAHBIMEDIC, S.A. DE C.V.': ['REAHBIMEDIC'],
    'RAMSA MOTORS, S.A. DE C.V.': ['RAMSA MOTORS'],
    'NISSAN ATIZAPAN AUTOS Y CAMIONES, S.A. DE C.V.': ['NISSAN ATIZAPAN'],
    'MOTORS VERACRUZ, S.A. DE C.V.': ['MOTORS VERACRUZ'],
    'I MOTORS XALAPA, S. DE R.L. DE C.V.': ['I MOTORS XALAPA'],
    'UNICONSTRUCCIONES AUTOMOTRICES, S.A.': ['UNICONSTRUCCIONES'],
  };
  
  let insertados = 0;
  
  for (const [nombreNormalizado, variantes] of Object.entries(proveedoresMap)) {
    // Contar vehículos de este proveedor
    let totalVehiculos = 0;
    let fechaInicio = null;
    
    for (const variante of variantes) {
      const count = query(
        'SELECT COUNT(*) as total FROM vehiculos WHERE UPPER(proveedor_arrendadora) LIKE ?',
        ['%' + variante.toUpperCase() + '%']
      );
      totalVehiculos += count.rows[0].total;
      
      // Obtener fecha más antigua de adquisición
      const fecha = query(
        'SELECT MIN(fecha_adquisicion) as fecha FROM vehiculos WHERE UPPER(proveedor_arrendadora) LIKE ? AND fecha_adquisicion IS NOT NULL',
        ['%' + variante.toUpperCase() + '%']
      );
      if (fecha.rows[0].fecha) {
        if (!fechaInicio || fecha.rows[0].fecha < fechaInicio) {
          fechaInicio = fecha.rows[0].fecha;
        }
      }
    }
    
    if (totalVehiculos > 0) {
      if (!fechaInicio) fechaInicio = '2010-01-01';
      
      query(`
        INSERT INTO proveedores (
          nombre, secretaria_id, fecha_inicio, fecha_fin, giro, 
          servicios, numero_contratos, activo
        ) VALUES (?, ?, ?, NULL, ?, ?, ?, 1)
      `, [
        nombreNormalizado,
        difId,
        fechaInicio,
        'Venta/Arrendamiento de vehiculos',
        'Proveedor de vehiculos para DIF',
        totalVehiculos
      ]);
      
      insertados++;
      console.log(`  ✓ ${nombreNormalizado} (${totalVehiculos} vehiculos, desde ${fechaInicio})`);
    }
  }
  
  console.log('\n✅ ' + insertados + ' proveedores reales creados');
  
  // Mostrar resumen
  const total = query('SELECT COUNT(*) as total FROM proveedores');
  console.log('\n📊 Total proveedores en base de datos:', total.rows[0].total);
  
  closeDatabase();
}

crearProveedoresReales().catch(console.error);
