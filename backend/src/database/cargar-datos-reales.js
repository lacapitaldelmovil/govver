/**
 * Script para LIMPIAR datos demo y cargar SOLO datos reales
 * - Limpia vehículos demo
 * - Mantiene secretarías oficiales
 * - Carga vehículos reales del Excel DIF
 * - Limpia proveedores demo
 */

const { initDatabase, query, closeDatabase } = require('./connection');
const XLSX = require('xlsx');
const path = require('path');

// Funciones de mapeo
function mapearTipo(tipo) {
  if (!tipo) return 'otro';
  const t = tipo.toString().toLowerCase().trim();
  if (t.includes('promaster') || t.includes('urvan') || t.includes('express') || t.includes('transit') || t.includes('sprinter') || t.includes('kangoo') || t.includes('combi')) return 'van';
  if (t.includes('ambulancia')) return 'emergencia';
  if (t.includes('pick') || t.includes('cabina') || t.includes('estacas') || t.includes('silverado')) return 'pickup';
  if (t.includes('rav') || t.includes('rogue') || t.includes('crv') || t.includes('suv') || t.includes('tracker')) return 'suv';
  if (t.includes('tsuru') || t.includes('versa') || t.includes('sentra') || t.includes('aveo') || t.includes('sedan')) return 'sedan';
  if (t.includes('autobus') || t.includes('bus')) return 'autobus';
  if (t.includes('moto') || t.includes('cuatri')) return 'motocicleta';
  if (t.includes('camion')) return 'camioneta';
  return 'otro';
}

function mapearEstatus(estatus) {
  if (!estatus) return null;
  const e = estatus.toString().toUpperCase().trim();
  if (e === 'MALO') return 'Malo';
  if (e === 'BUENO') return 'Bueno';
  if (e === 'REGULAR') return 'Regular';
  return null;
}

function excelDateToJS(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

function detectarSeccion(rowIndex) {
  if (rowIndex >= 497) {
    return { clasificacion: 'comodato_externo', prefijo: 'DIF-COM', descripcion: 'VEHÍCULO EN COMODATO A OTRAS DEPENDENCIAS' };
  } else if (rowIndex >= 474) {
    return { clasificacion: 'determinacion', prefijo: 'DIF-DET', descripcion: 'VEHÍCULO EN DETERMINACIÓN ADMINISTRATIVA' };
  } else if (rowIndex >= 385) {
    return { clasificacion: 'donado', prefijo: 'DIF-DON', descripcion: 'VEHÍCULO DONADO COMO DESECHO FERROSO' };
  } else {
    return { clasificacion: 'operativo', prefijo: 'DIF', descripcion: '' };
  }
}

function mapearEstadoOperativo(estatus, situacion, clasificacion) {
  const sit = String(situacion || '').toUpperCase();
  
  if (clasificacion === 'donado' || clasificacion === 'comodato_externo') {
    return 'Baja';
  }
  if (clasificacion === 'determinacion') {
    return 'Mal estado';
  }
  if (sit.includes('ROBADO') || sit.includes('CALCINADO') || sit.includes('SINIESTRO')) {
    return 'Baja';
  }
  if (sit.includes('TALLER') || sit.includes('REPARACION') || sit.includes('REPARACIÓN')) {
    return 'En taller';
  }
  
  const est = String(estatus || '').toUpperCase();
  if (est === 'MALO') return 'Mal estado';
  if (est === 'REGULAR') return 'Operando';
  if (est === 'BUENO') return 'Operando';
  
  return 'Operando';
}

async function limpiarYCargarReales() {
  console.log('🧹 LIMPIANDO DATOS DEMO Y CARGANDO DATOS REALES...\n');

  await initDatabase();

  // ============================================
  // PASO 1: Limpiar datos demo
  // ============================================
  console.log('📦 Paso 1: Limpiando datos demo...');
  
  // Limpiar tablas de datos
  query('DELETE FROM proveedores');
  console.log('   ✓ Proveedores eliminados');
  
  query('DELETE FROM movimientos');
  console.log('   ✓ Movimientos eliminados');
  
  query('DELETE FROM solicitudes');
  console.log('   ✓ Solicitudes eliminadas');
  
  query('DELETE FROM mantenimientos');
  console.log('   ✓ Mantenimientos eliminados');
  
  query('DELETE FROM vehiculos');
  console.log('   ✓ Vehículos eliminados');
  
  query('DELETE FROM registro_accesos');
  console.log('   ✓ Registro de accesos eliminado');

  // ============================================
  // PASO 2: Verificar/Actualizar usuarios admin
  // ============================================
  console.log('\n👤 Paso 2: Verificando usuarios...');
  
  // Mantener solo usuarios esenciales, eliminar demos
  const usuariosDemo = query(`SELECT id FROM usuarios WHERE email LIKE '%demo%' OR email LIKE '%test%'`);
  if (usuariosDemo.rows.length > 0) {
    query(`DELETE FROM usuarios WHERE email LIKE '%demo%' OR email LIKE '%test%'`);
    console.log(`   ✓ ${usuariosDemo.rows.length} usuarios demo eliminados`);
  }
  
  // Verificar que existe el admin principal
  const adminExists = query(`SELECT id FROM usuarios WHERE email = 'admin@veracruz.gob.mx'`);
  if (adminExists.rows.length === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Veracruz2024!', 10);
    query(`INSERT INTO usuarios (email, password, nombre, rol, activo) VALUES (?, ?, ?, ?, ?)`,
      ['admin@veracruz.gob.mx', hashedPassword, 'Administrador General', 'admin', 1]);
    console.log('   ✓ Usuario admin creado');
  } else {
    console.log('   ✓ Usuario admin existente');
  }

  // ============================================
  // PASO 3: Cargar vehículos reales del DIF
  // ============================================
  console.log('\n🚗 Paso 3: Cargando vehículos reales del DIF...');
  
  // Obtener ID del DIF
  const dif = query('SELECT id FROM secretarias WHERE siglas = ?', ['DIF']);
  if (dif.rows.length === 0) {
    console.log('❌ No se encontró la secretaría DIF');
    closeDatabase();
    return;
  }
  const difId = dif.rows[0].id;

  // Leer Excel
  const excelPath = path.join(__dirname, '..', '..', '..', 'PADRON VEHICULAR 2026 DIRECCION GENERAL.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const dataRaw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`   Filas en Excel: ${dataRaw.length}`);

  let insertados = 0;
  let porClasificacion = { operativo: 0, donado: 0, determinacion: 0, comodato_externo: 0 };
  let contador = 1;

  for (let rowIndex = 0; rowIndex < dataRaw.length; rowIndex++) {
    const row = dataRaw[rowIndex];
    if (!row || row.length < 8) continue;
    
    const placa = row[7];
    const serie = row[8];
    const marca = row[3];
    const tipo = row[4];
    
    if (!placa || !serie || placa === 'PLACA ACTUAL' || serie === 'SERIE') continue;
    if (String(placa).includes('VEHICULOS') || String(placa).includes('FOTRADIS')) continue;

    const placaLimpia = String(placa).trim();
    const seccion = detectarSeccion(rowIndex);
    
    const area = row[2] || 'DIF';
    const anio = row[5];
    const motor = row[6];
    const poliza = row[9];
    const vigenciaPoliza = row[10];
    const situacion = row[11];
    const estatus = row[12];
    
    const colSI = String(row[13] || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const colNO = String(row[14] || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const enUso = colSI === 'SI' || colSI === 'S' || (colNO !== 'NO' && colSI !== '');
    
    const situacionUpper = String(situacion || '').toUpperCase();
    const propuestoBaja = situacionUpper.includes('PROPUESTO') && situacionUpper.includes('BAJA');
    
    const factura = row[15];
    const proveedor = row[16];
    const fechaAdq = excelDateToJS(row[17]);
    const valorAdq = row[18];
    const ubicacion = row[19];
    const observaciones = row[20];
    const municipio = row[21];
    const resguardante = row[22];

    const estadoOperativo = mapearEstadoOperativo(estatus, situacion, seccion.clasificacion);
    const numEconomico = `${seccion.prefijo}-${String(contador).padStart(3, '0')}`;
    contador++;

    try {
      query(`
        INSERT INTO vehiculos (
          placas, numero_serie, marca, modelo, anio, tipo,
          numero_economico, secretaria_id, area_responsable,
          poliza_seguro, vigencia_seguro,
          situacion_juridica, estatus, estado_operativo,
          en_uso, propuesto_baja,
          proveedor_arrendadora, fecha_adquisicion, valor_libros,
          ubicacion_fisica, observaciones, municipio,
          resguardante_nombre, clasificacion, regimen, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        placaLimpia,
        String(serie || '').trim(),
        String(marca || '').trim(),
        String(tipo || '').trim(),
        anio ? parseInt(anio) : null,
        mapearTipo(tipo),
        numEconomico,
        difId,
        String(area || '').trim(),
        String(poliza || '').trim() || null,
        vigenciaPoliza ? String(vigenciaPoliza).trim() : null,
        String(situacion || '').trim() || null,
        mapearEstatus(estatus),
        estadoOperativo,
        enUso ? 1 : 0,
        propuestoBaja ? 1 : 0,
        String(proveedor || '').trim() || null,
        fechaAdq,
        valorAdq ? parseFloat(valorAdq) : null,
        String(ubicacion || '').trim() || null,
        seccion.descripcion ? `${seccion.descripcion}. ${observaciones || ''}`.trim() : String(observaciones || '').trim() || null,
        String(municipio || '').trim() || null,
        String(resguardante || '').trim() || null,
        seccion.clasificacion,
        'Propio',
      ]);
      
      insertados++;
      porClasificacion[seccion.clasificacion]++;
      
      if (insertados % 100 === 0) {
        console.log(`   ... ${insertados} vehículos insertados`);
      }
    } catch (error) {
      // Silenciar errores de duplicados
    }
  }

  console.log(`\n✅ ${insertados} vehículos del DIF insertados`);
  console.log(`   🚙 ${porClasificacion.operativo} vehículos operativos`);
  console.log(`   🎁 ${porClasificacion.donado} vehículos DONADOS (pendiente baja)`);
  console.log(`   ⚠️  ${porClasificacion.determinacion} en Determinación Administrativa`);
  console.log(`   🔄 ${porClasificacion.comodato_externo} en Comodato a otras dependencias`);

  // Contar propuestos para baja
  const propuestos = query('SELECT COUNT(*) as total FROM vehiculos WHERE propuesto_baja = 1');
  console.log(`   📋 ${propuestos.rows[0]?.total || 0} propuestos para baja`);

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(50));
  
  const totalVehiculos = query('SELECT COUNT(*) as total FROM vehiculos');
  const totalUsuarios = query('SELECT COUNT(*) as total FROM usuarios');
  const totalSecretarias = query('SELECT COUNT(*) as total FROM secretarias WHERE activa = 1');
  
  console.log(`   Vehículos: ${totalVehiculos.rows[0]?.total || 0}`);
  console.log(`   Usuarios: ${totalUsuarios.rows[0]?.total || 0}`);
  console.log(`   Secretarías activas: ${totalSecretarias.rows[0]?.total || 0}`);
  console.log(`   Proveedores: 0 (listos para agregar reales)`);
  
  closeDatabase();

  console.log('\n🎉 ¡LIMPIEZA Y CARGA DE DATOS REALES COMPLETADA!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Email: admin@veracruz.gob.mx');
  console.log('   Contraseña: Veracruz2024!');
}

limpiarYCargarReales().catch(console.error);
