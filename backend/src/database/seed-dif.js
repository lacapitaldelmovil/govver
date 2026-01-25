/**
 * Script para agregar TODOS los vehiculos del DIF desde PADRON VEHICULAR 2026
 * Incluye secciones especiales para los de Determinación Administrativa y Comodato
 * Detecta automáticamente la sección por posición en el Excel
 */

const { initDatabase, query, closeDatabase } = require('./connection');
const XLSX = require('xlsx');
const path = require('path');

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
  // Valores reales del Excel: REGULAR, MALO, BUENO
  if (e === 'MALO') return 'Malo';
  if (e === 'BUENO') return 'Bueno';
  if (e === 'REGULAR') return 'Regular';
  return null;
}

function mapearRegimen(regimen) {
  if (!regimen) return 'Propio';
  const r = regimen.toString().toUpperCase().trim();
  // Solo arrendados explícitos, el resto es Propio
  // Los Comodato se asignan solo a vehículos específicos en placasComodato
  if (r.includes('ARREND')) return 'Arrendado';
  return 'Propio';
}

function excelDateToJS(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// Detectar secciones en el Excel basándose en filas específicas
function detectarSeccion(rowIndex) {
  // Basado en el análisis del Excel:
  // Fila 0-384: Vehículos operativos normales
  // Fila 385-473: Vehículos DONADOS (pendiente baja)
  // Fila 474-496: Vehículos en DETERMINACIÓN ADMINISTRATIVA
  // Fila 497+: Vehículos en COMODATO a otras dependencias
  
  if (rowIndex >= 497) {
    return { 
      clasificacion: 'comodato_externo', 
      prefijo: 'DIF-COM',
      descripcion: 'VEHÍCULO EN COMODATO A OTRAS DEPENDENCIAS'
    };
  } else if (rowIndex >= 474) {
    return { 
      clasificacion: 'determinacion', 
      prefijo: 'DIF-DET',
      descripcion: 'VEHÍCULO EN DETERMINACIÓN ADMINISTRATIVA - Pendiente baja vehicular'
    };
  } else if (rowIndex >= 385) {
    return { 
      clasificacion: 'donado', 
      prefijo: 'DIF-DON',
      descripcion: 'VEHÍCULO DONADO COMO DESECHO FERROSO - Pendiente baja ante Hacienda del Estado'
    };
  } else {
    return { 
      clasificacion: 'operativo', 
      prefijo: 'DIF',
      descripcion: ''
    };
  }
}

async function seedDIF() {
  console.log('Cargando TODOS los vehiculos del DIF desde Excel...\n');

  await initDatabase();

  const dif = query('SELECT id FROM secretarias WHERE siglas = ?', ['DIF']);
  if (dif.rows.length === 0) {
    console.log('No se encontro la secretaria DIF');
    closeDatabase();
    return;
  }
  const difId = dif.rows[0].id;

  // Borrar vehiculos anteriores del DIF
  query('DELETE FROM vehiculos WHERE secretaria_id = ?', [difId]);
  console.log('Vehiculos anteriores del DIF eliminados\n');

  // Leer Excel - usar header:1 para tener acceso al índice de fila
  const excelPath = path.join(__dirname, '..', '..', '..', 'PADRON VEHICULAR 2026 DIRECCION GENERAL.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const dataRaw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log('Filas en Excel:', dataRaw.length);

  let insertados = 0;
  let porClasificacion = { operativo: 0, donado: 0, determinacion: 0, comodato_externo: 0 };
  let contador = 1;

  for (let rowIndex = 0; rowIndex < dataRaw.length; rowIndex++) {
    const row = dataRaw[rowIndex];
    if (!row || row.length < 8) continue;
    
    // Columnas basadas en el análisis del Excel
    const placa = row[7];
    const serie = row[8];
    const marca = row[3];
    const tipo = row[4];
    
    if (!placa || !serie || placa === 'PLACA ACTUAL' || serie === 'SERIE') continue;
    if (String(placa).includes('VEHICULOS') || String(placa).includes('FOTRADIS')) continue;

    const placaLimpia = String(placa).trim();
    
    // Mapear columnas según posición en Excel (header:1)
    const area = row[2] || 'DIF';
    const anio = row[5];
    const motor = row[6];
    const poliza = row[9];
    const vigenciaPoliza = row[10];
    const situacion = row[11];
    const estatus = row[12];
    // En el Excel: columna 13 = "SI" (en uso), columna 14 = "NO" (no en uso)
    const colSI = String(row[13] || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const colNO = String(row[14] || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    // Si la columna 13 dice "SI" o la columna 14 NO dice "NO", está en uso
    const enUso = colSI === 'SI' || colSI === 'S' || (colNO !== 'NO' && colSI !== '');
    
    // Detectar "PROPUESTO PARA BAJA" desde la columna situacion (columna 11)
    const situacionUpper = String(situacion || '').toUpperCase();
    const propuestoBaja = situacionUpper.includes('PROPUESTO') && situacionUpper.includes('BAJA');
    
    const factura = row[15];
    const proveedor = row[16];
    const fechaAdq = excelDateToJS(row[17]);
    const valor = row[18];
    
    // Detectar sección basándose en la fila
    const seccion = detectarSeccion(rowIndex);
    
    // Generar kilometraje aleatorio basado en antigüedad
    const anioVehiculo = parseInt(anio) || 2020;
    const antiguedad = 2026 - anioVehiculo;
    const kmBase = antiguedad * 12000 + Math.floor(Math.random() * 20000);
    const kilometraje = Math.min(kmBase, 300000);

    // Determinar color basado en tipo de vehículo
    const colores = ['Blanco', 'Gris', 'Negro', 'Azul', 'Rojo', 'Plateado'];
    const colorIndex = (placaLimpia.charCodeAt(0) + (anioVehiculo % 10)) % colores.length;
    const colorVehiculo = colores[colorIndex];

    let prefijo = seccion.prefijo;
    let descripcionExtra = seccion.descripcion;
    let estatusFinal = mapearEstatus(estatus); // MALO, BUENO, REGULAR
    let clasificacion = seccion.clasificacion;
    
    // Revisar si la situación indica que el vehículo está en taller
    const situacionStr = situacion ? String(situacion).toUpperCase() : '';
    const estaEnTaller = situacionStr.includes('TALLER') || situacionStr.includes('REPARACION');
    // Revisar si es desecho ferroso en la situación
    const esDesechoFerroso = situacionStr.includes('DESECHO') || situacionStr.includes('FERROSO');
    
    // Determinar estado operativo con lógica clara:
    // - En taller: Situación dice TALLER (prioridad alta)
    // - Operando: En uso (columna dice SI)
    // - Disponible: No en uso + Estatus Bueno o Regular
    // - Mal estado: No en uso + Estatus Malo (disponibles pero en mal estado)
    // - Baja: Donados, Desecho ferroso, o en Determinación Administrativa
    let estadoOp;
    if (estaEnTaller) {
      estadoOp = 'En taller'; // Prioridad: si está en taller, es En taller
    } else if (clasificacion === 'donado' || clasificacion === 'determinacion' || esDesechoFerroso) {
      estadoOp = 'Baja';
    } else if (enUso) {
      estadoOp = 'Operando';
    } else if (estatusFinal === 'Malo') {
      estadoOp = 'Mal estado'; // No en uso + mal estado = disponibles pero en mal estado
    } else {
      estadoOp = 'Disponible'; // No en uso + Bueno/Regular = disponibles para usar
    }
    
    let regimenFinal = mapearRegimen(situacion);
    
    // Si es comodato externo, marcar régimen como Comodato
    if (clasificacion === 'comodato_externo') {
      regimenFinal = 'Comodato';
    }

    const vehiculo = {
      numero_inventario: `${prefijo}-${String(contador).padStart(4, '0')}`,
      numero_economico: `${prefijo}-ECO-${String(contador).padStart(4, '0')}`,
      placas: placaLimpia,
      numero_serie: String(serie).trim(),
      descripcion: `${marca} ${tipo} ${anio || ''}`.trim(),
      descripcion_detallada: descripcionExtra ? `${descripcionExtra}. Area: ${area}. Motor: ${motor || 'N/A'}. Situación: ${situacion || 'N/A'}` : `Area: ${area}. Motor: ${motor || 'N/A'}. Situación: ${situacion || 'N/A'}`,
      marca: String(marca || '').trim().toUpperCase(),
      modelo: String(tipo || '').trim().toUpperCase(),
      anio: parseInt(anio) || null,
      color: colorVehiculo,
      tipo: mapearTipo(tipo),
      valor_libros: (typeof valor === 'number') ? valor : null,
      fecha_adquisicion: fechaAdq,
      ubicacion_fisica: String(area || 'DIF').trim(),
      municipio: String(area || 'Xalapa').trim(),
      secretaria_id: difId,
      area_responsable: String(area || 'DIF').trim(),
      estado_operativo: estadoOp,
      estatus: estatusFinal,
      en_uso: enUso ? 1 : 0,
      kilometraje: kilometraje,
      poliza_seguro: poliza ? String(poliza) : null,
      vigencia_seguro: typeof vigenciaPoliza === 'string' ? vigenciaPoliza.replace(' VENCIDA', '').trim() : excelDateToJS(vigenciaPoliza),
      regimen: regimenFinal,
      clasificacion: clasificacion,
      propuesto_baja: propuestoBaja ? 1 : 0,
      proveedor_arrendadora: proveedor ? String(proveedor).trim() : null,
      observaciones: `Proveedor: ${proveedor || 'N/A'}. Factura: ${factura || 'N/A'}. Motor: ${motor || 'N/A'}`,
      situacion_juridica: situacion ? String(situacion).trim() : null
    };

    try {
      query(
        `INSERT INTO vehiculos (numero_inventario, numero_economico, placas, numero_serie, descripcion, descripcion_detallada, marca, modelo, anio, color, tipo, valor_libros, fecha_adquisicion, ubicacion_fisica, municipio, secretaria_id, area_responsable, estado_operativo, estatus, en_uso, kilometraje, poliza_seguro, vigencia_seguro, regimen, proveedor_arrendadora, observaciones, situacion_juridica, clasificacion, propuesto_baja, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          vehiculo.numero_inventario, vehiculo.numero_economico, vehiculo.placas,
          vehiculo.numero_serie, vehiculo.descripcion, vehiculo.descripcion_detallada,
          vehiculo.marca, vehiculo.modelo, vehiculo.anio, vehiculo.color, vehiculo.tipo,
          vehiculo.valor_libros, vehiculo.fecha_adquisicion, vehiculo.ubicacion_fisica,
          vehiculo.municipio, vehiculo.secretaria_id, vehiculo.area_responsable,
          vehiculo.estado_operativo, vehiculo.estatus, vehiculo.en_uso, vehiculo.kilometraje,
          vehiculo.poliza_seguro, vehiculo.vigencia_seguro, vehiculo.regimen,
          vehiculo.proveedor_arrendadora, vehiculo.observaciones, vehiculo.situacion_juridica,
          vehiculo.clasificacion, vehiculo.propuesto_baja
        ]
      );
      insertados++;
      porClasificacion[clasificacion]++;
      contador++;
      if (insertados % 100 === 0) console.log(`... ${insertados} vehiculos insertados`);
    } catch (error) {
      if (!error.message.includes('UNIQUE')) {
        console.log(`ERROR fila ${rowIndex} (${placa}): ${error.message}`);
      }
    }
  }

  console.log(`\n✅ ${insertados} vehiculos del DIF insertados`);
  console.log(`   � ${porClasificacion.operativo} vehiculos operativos`);
  console.log(`   🎁 ${porClasificacion.donado} vehiculos DONADOS (pendiente baja)`);
  console.log(`   ⚠️  ${porClasificacion.determinacion} en Determinación Administrativa`);
  console.log(`   🔄 ${porClasificacion.comodato_externo} en Comodato a otras dependencias`);
  
  const total = query('SELECT COUNT(*) as total FROM vehiculos WHERE secretaria_id = ?', [difId]);
  console.log(`\n📊 Total vehiculos DIF en base de datos: ${total.rows[0].total}`);
  
  closeDatabase();
}

seedDIF().catch(console.error);
