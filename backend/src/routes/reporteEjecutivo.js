/**
 * Generador de Reporte Ejecutivo - Gobierno del Estado de Veracruz
 * Versión Profesional e Institucional
 * Optimizado para presentación ejecutiva y dispositivos móviles
 */

const { query } = require('../database/connection');
const { getLogoBase64 } = require('./logoBase64');

function generarReporteEjecutivo(req) {
  const { fecha_inicio, fecha_fin } = req.query;
  
  // Obtener logo en base64
  const logoBase64 = getLogoBase64();
  
  // Determinar permisos
  const esAdmin = req.user.rol === 'admin' || req.user.rol === 'gobernacion' || req.user.rol === 'flota';
  const secretariaId = req.user.secretaria_id;
  const filtroSecretaria = (!esAdmin && secretariaId) ? `AND secretaria_id = ${secretariaId}` : '';
  
  // Nombre de la secretaría
  let nombreSecretaria = 'Sistema DIF Estatal de Veracruz';
  let siglasSecretaria = 'DIF VERACRUZ';
  if (!esAdmin && secretariaId) {
    const secInfo = query('SELECT nombre, siglas FROM secretarias WHERE id = ?', [secretariaId]).rows[0];
    if (secInfo) {
      nombreSecretaria = secInfo.nombre;
      siglasSecretaria = secInfo.siglas;
    }
  }

  // Fecha del reporte
  const fechaReporte = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const fechaHora = new Date().toLocaleString('es-MX');

  // ========== DATOS DE LA FLOTA ==========
  const totalVehiculos = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 ${filtroSecretaria}`).rows[0]?.total || 0;
  const vehiculosOperando = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Operando' ${filtroSecretaria}`).rows[0]?.total || 0;
  const vehiculosDisponibles = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Disponible' ${filtroSecretaria}`).rows[0]?.total || 0;
  const vehiculosMalEstado = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Mal estado' ${filtroSecretaria}`).rows[0]?.total || 0;
  const vehiculosEnTaller = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'En taller' ${filtroSecretaria}`).rows[0]?.total || 0;
  const vehiculosBaja = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Baja' ${filtroSecretaria}`).rows[0]?.total || 0;
  const propuestosBaja = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND propuesto_baja = 1 ${filtroSecretaria}`).rows[0]?.total || 0;
  const vehiculosResguardo = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Resguardo' ${filtroSecretaria}`).rows[0]?.total || 0;
  
  // Pendientes SAT/Hacienda (tienen DIF-DET en número de inventario)
  const pendientesSAT = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND numero_inventario LIKE 'DIF-DET%' ${filtroSecretaria}`).rows[0]?.total || 0;
  const pendientesHacienda = pendientesSAT; // Alias para Hacienda

  // Condición física
  const estadoBueno = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estatus = 'Bueno' ${filtroSecretaria}`).rows[0]?.total || 0;
  const estadoRegular = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estatus = 'Regular' ${filtroSecretaria}`).rows[0]?.total || 0;
  const estadoMalo = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estatus = 'Malo' ${filtroSecretaria}`).rows[0]?.total || 0;
  const estadoSinEspecificar = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND (estatus IS NULL OR estatus = '' OR estatus = 'null') ${filtroSecretaria}`).rows[0]?.total || 0;

  // Régimen de propiedad
  const vehiculosPropios = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND regimen = 'Propio' ${filtroSecretaria}`).rows[0]?.total || 0;
  const vehiculosComodato = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND regimen = 'Comodato' ${filtroSecretaria}`).rows[0]?.total || 0;

  // Valor de la flota
  const valorFlota = query(`SELECT SUM(valor_libros) as valor_total FROM vehiculos WHERE activo = 1 AND valor_libros > 0 ${filtroSecretaria}`).rows[0]?.valor_total || 0;

  // Análisis de seguros por fecha de vigencia
  const todosVehiculos = query(`SELECT id, vigencia_seguro, poliza_seguro FROM vehiculos WHERE activo = 1 ${filtroSecretaria}`).rows;
  const hoy = new Date();
  const en30Dias = new Date();
  en30Dias.setDate(hoy.getDate() + 30);
  
  let segurosVencidos = 0;
  let segurosPorVencer = 0;
  let segurosVigentes = 0;
  let segurosNA = 0;
  
  // Mapeo de meses en español
  const mesesES = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
    'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
  };
  
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'NO APLICA' || dateStr === 'N/A' || dateStr === 'SIN DATO' || dateStr.trim() === '') return null;
    const clean = dateStr.replace(/\s*VENCIDA\s*/gi, '').trim();
    
    // Formato ISO: 2026-03-10
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return new Date(clean);
    
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('/');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
    
    // Formato español: "31 DE AGOSTO 2026" o "31 DE AGOSTO DE 2026"
    const matchES = clean.match(/^(\d{1,2})\s+DE\s+(\w+)\s+(?:DE\s+)?(\d{4})$/i);
    if (matchES) {
      const dia = parseInt(matchES[1]);
      const mesNombre = matchES[2].toLowerCase();
      const anio = parseInt(matchES[3]);
      const mes = mesesES[mesNombre];
      if (mes !== undefined) {
        return new Date(anio, mes, dia);
      }
    }
    
    return null;
  };
  
  todosVehiculos.forEach(v => {
    const fecha = parseDate(v.vigencia_seguro);
    if (!fecha) {
      segurosNA++;
    } else if (fecha < hoy) {
      segurosVencidos++;
    } else if (fecha <= en30Dias) {
      segurosPorVencer++;
    } else {
      segurosVigentes++;
    }
  });
  
  // Contar vehículos con póliza registrada
  const vehiculosConPoliza = query(`
    SELECT COUNT(*) as total FROM vehiculos 
    WHERE activo = 1 
    AND poliza_seguro IS NOT NULL 
    AND poliza_seguro != '' 
    AND poliza_seguro != 'SIN POLIZA' 
    AND poliza_seguro != 'SIN DATO'
    AND poliza_seguro != 'EN TRAMITE'
    ${filtroSecretaria}
  `).rows[0]?.total || 0;
  
  const vehiculosSinPoliza = query(`
    SELECT COUNT(*) as total FROM vehiculos 
    WHERE activo = 1 
    AND (poliza_seguro IS NULL OR poliza_seguro = '' OR poliza_seguro = 'SIN POLIZA' OR poliza_seguro = 'SIN DATO')
    ${filtroSecretaria}
  `).rows[0]?.total || 0;
  
  const vehiculosPolizaTramite = query(`
    SELECT COUNT(*) as total FROM vehiculos 
    WHERE activo = 1 
    AND poliza_seguro = 'EN TRAMITE'
    ${filtroSecretaria}
  `).rows[0]?.total || 0;

  // Extraer aseguradoras del campo poliza_seguro
  const polizasConAseguradora = query(`
    SELECT poliza_seguro FROM vehiculos 
    WHERE activo = 1 AND poliza_seguro IS NOT NULL AND poliza_seguro != '' ${filtroSecretaria}
  `).rows;
  
  // Función para normalizar nombre de aseguradora (corrige errores de escritura)
  const normalizarAseguradora = (nombre) => {
    if (!nombre) return null;
    const upper = nombre.toUpperCase().trim();
    // Si contiene variantes de "GENERAL" y "SEGURO", normalizamos a GENERAL DE SEGUROS
    if ((upper.includes('GENERAL') || upper.includes('GENEAL') || upper.includes('GENEL')) && 
        (upper.includes('SEGURO') || upper.includes('SERUGOS') || upper.includes('SEGUROSS') || upper.includes('SEGUIRO'))) {
      return 'GENERAL DE SEGUROS, S.A.';
    }
    return upper;
  };
  
  // Función para extraer nombre de aseguradora
  const extraerAseguradora = (poliza) => {
    if (!poliza) return null;
    // Si hay un salto de línea, la aseguradora está en la segunda parte
    if (poliza.includes('\n')) {
      const partes = poliza.split('\n');
      if (partes[1] && partes[1].trim()) {
        return normalizarAseguradora(partes[1]);
      }
    }
    // Buscar texto después del paréntesis
    const matchParentesis = poliza.match(/\)\s*([A-Za-záéíóúñÁÉÍÓÚÑ\s,.]+)$/);
    if (matchParentesis && matchParentesis[1] && matchParentesis[1].trim().length > 3) {
      return normalizarAseguradora(matchParentesis[1]);
    }
    return null;
  };
  
  // Contar por aseguradora
  const aseguradoras = {};
  let vehiculosConAseguradora = 0;
  polizasConAseguradora.forEach(p => {
    const aseg = extraerAseguradora(p.poliza_seguro);
    if (aseg) {
      aseguradoras[aseg] = (aseguradoras[aseg] || 0) + 1;
      vehiculosConAseguradora++;
    }
  });
  
  // Ordenar aseguradoras por cantidad
  const topAseguradoras = Object.entries(aseguradoras)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Tipos de vehículos
  const tiposVehiculo = query(`
    SELECT 
      CASE 
        WHEN LOWER(tipo) = 'van' THEN 'Van'
        WHEN LOWER(tipo) = 'pickup' THEN 'Pickup'
        WHEN LOWER(tipo) = 'sedan' THEN 'Sedán'
        WHEN LOWER(tipo) = 'suv' THEN 'SUV'
        WHEN LOWER(tipo) = 'camioneta' THEN 'Camioneta'
        WHEN LOWER(tipo) = 'autobus' THEN 'Autobús'
        WHEN LOWER(tipo) = 'motocicleta' THEN 'Motocicleta'
        WHEN LOWER(tipo) = 'emergencia' THEN 'Emergencia'
        ELSE 'Otro'
      END as tipo_nombre,
      COUNT(*) as cantidad
    FROM vehiculos 
    WHERE activo = 1 ${filtroSecretaria}
    GROUP BY tipo_nombre
    ORDER BY cantidad DESC
  `).rows;

  // Distribución por municipio (solo municipios reales, no dependencias)
  const municipios = query(`
    SELECT 
      municipio,
      COUNT(*) as total,
      SUM(CASE WHEN estado_operativo IN ('Operando', 'Disponible') THEN 1 ELSE 0 END) as operando,
      SUM(CASE WHEN estado_operativo = 'Mal Estado' THEN 1 ELSE 0 END) as mal_estado,
      SUM(CASE WHEN estado_operativo = 'Baja' THEN 1 ELSE 0 END) as baja
    FROM vehiculos 
    WHERE activo = 1 AND municipio IS NOT NULL AND es_dependencia = 0 ${filtroSecretaria}
    GROUP BY municipio 
    ORDER BY municipio ASC
  `).rows;

  // Distribución por dependencias (oficinas centrales, CAS, CRIS, etc.)
  const dependencias = query(`
    SELECT 
      municipio as nombre,
      COUNT(*) as total,
      SUM(CASE WHEN estado_operativo IN ('Operando', 'Disponible') THEN 1 ELSE 0 END) as operando,
      SUM(CASE WHEN estado_operativo = 'Mal Estado' THEN 1 ELSE 0 END) as mal_estado,
      SUM(CASE WHEN estado_operativo = 'Baja' THEN 1 ELSE 0 END) as baja
    FROM vehiculos 
    WHERE activo = 1 AND municipio IS NOT NULL AND es_dependencia = 1 ${filtroSecretaria}
    GROUP BY municipio 
    ORDER BY total DESC
  `).rows;

  // Antigüedad de flota
  const anioActual = new Date().getFullYear();
  const vehiculosNuevos = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 ${filtroSecretaria} AND anio >= ?`, [anioActual - 5]).rows[0]?.total || 0;
  const vehiculosMedianos = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 ${filtroSecretaria} AND anio BETWEEN ? AND ?`, [anioActual - 10, anioActual - 6]).rows[0]?.total || 0;
  const vehiculosAntiguos = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 ${filtroSecretaria} AND anio < ?`, [anioActual - 10]).rows[0]?.total || 0;

  // Promedio de antigüedad
  const promedioAnio = query(`SELECT AVG(anio) as promedio FROM vehiculos WHERE activo = 1 AND anio > 0 ${filtroSecretaria}`).rows[0]?.promedio || 0;
  const edadPromedio = promedioAnio > 0 ? Math.round(anioActual - promedioAnio) : 0;

  // Top 3 marcas
  const topMarcas = query(`
    SELECT marca, COUNT(*) as cantidad 
    FROM vehiculos 
    WHERE activo = 1 AND marca IS NOT NULL ${filtroSecretaria}
    GROUP BY marca 
    ORDER BY cantidad DESC 
    LIMIT 3
  `).rows;

  // Proveedores principales con fechas
  const topProveedores = query(`
    SELECT 
      proveedor_arrendadora, 
      COUNT(*) as cantidad,
      MIN(fecha_adquisicion) as primera_fecha,
      MAX(fecha_adquisicion) as ultima_fecha
    FROM vehiculos
    WHERE activo = 1 AND proveedor_arrendadora IS NOT NULL ${filtroSecretaria}
    GROUP BY proveedor_arrendadora
    ORDER BY cantidad DESC
    LIMIT 3
  `).rows;

  // Total de proveedores únicos
  const totalProveedores = query(`
    SELECT COUNT(DISTINCT proveedor_arrendadora) as total
    FROM vehiculos
    WHERE activo = 1 AND proveedor_arrendadora IS NOT NULL ${filtroSecretaria}
  `).rows[0]?.total || 0;

  // Distribución por municipio
  const topMunicipios = query(`
    SELECT municipio, COUNT(*) as cantidad
    FROM vehiculos
    WHERE activo = 1 AND municipio IS NOT NULL AND municipio != '' ${filtroSecretaria}
    GROUP BY municipio
    ORDER BY cantidad DESC
    LIMIT 3
  `).rows;

  // Vehículos propuestos para baja (detalle)
  const detallePropuestosBaja = query(`
    SELECT marca, modelo, placas, anio, motivo_propuesta_baja
    FROM vehiculos
    WHERE activo = 1 AND propuesto_baja = 1 ${filtroSecretaria}
    ORDER BY anio ASC
    LIMIT 15
  `).rows;

  // Cálculos de porcentajes
  const porcOperando = totalVehiculos > 0 ? ((vehiculosOperando / totalVehiculos) * 100).toFixed(1) : '0';
  const porcDisponible = totalVehiculos > 0 ? ((vehiculosDisponibles / totalVehiculos) * 100).toFixed(1) : '0';
  const porcMalEstado = totalVehiculos > 0 ? ((vehiculosMalEstado / totalVehiculos) * 100).toFixed(1) : '0';
  const porcBaja = totalVehiculos > 0 ? ((vehiculosBaja / totalVehiculos) * 100).toFixed(1) : '0';
  const porcBueno = totalVehiculos > 0 ? ((estadoBueno / totalVehiculos) * 100).toFixed(1) : '0';
  const porcRegular = totalVehiculos > 0 ? ((estadoRegular / totalVehiculos) * 100).toFixed(1) : '0';
  const porcMalo = totalVehiculos > 0 ? ((estadoMalo / totalVehiculos) * 100).toFixed(1) : '0';
  const porcSegurosVencidos = totalVehiculos > 0 ? ((segurosVencidos / totalVehiculos) * 100).toFixed(1) : '0';
  const porcSegurosVigentes = totalVehiculos > 0 ? ((segurosVigentes / totalVehiculos) * 100).toFixed(1) : '0';
  const porcSegurosNA = totalVehiculos > 0 ? ((segurosNA / totalVehiculos) * 100).toFixed(1) : '0';

  // Formateo de números
  const formatNumber = (n) => new Intl.NumberFormat('es-MX').format(n || 0);
  const formatMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0);

  // ========== GENERAR HTML PROFESIONAL ==========
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Ejecutivo - Flota Vehicular - Gobierno de Veracruz</title>
  <style>
    @page {
      size: letter;
      margin: 1.5cm;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #2d3748;
      background: #ffffff;
      font-size: 13px;
    }
    
    .container {
      max-width: 850px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* ============ ENCABEZADO INSTITUCIONAL ============ */
    .header-institucional {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 25px;
      background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 50%, #1a472a 100%);
      border-radius: 8px;
      margin-bottom: 25px;
      border-bottom: 4px solid #c9a227;
    }
    
    .header-logo {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .header-logo img {
      width: 65px;
      height: 65px;
      object-fit: contain;
    }
    
    .header-text {
      flex: 1;
      text-align: center;
      color: white;
      padding: 0 20px;
    }
    
    .header-text h1 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    
    .header-text h2 {
      font-size: 15px;
      font-weight: 400;
      opacity: 0.95;
      margin-bottom: 8px;
    }
    
    .header-text .subtitulo {
      font-size: 20px;
      font-weight: 700;
      color: #c9a227;
      margin-top: 8px;
    }
    
    .header-fecha {
      text-align: right;
      color: rgba(255,255,255,0.85);
      font-size: 11px;
    }
    
    .header-fecha .fecha-valor {
      color: white;
      font-weight: 600;
    }
    
    /* ============ RESUMEN EJECUTIVO ============ */
    .resumen-ejecutivo {
      background: #f8f9fa;
      border: 1px solid #e2e8f0;
      border-left: 5px solid #1a472a;
      border-radius: 6px;
      padding: 25px;
      margin-bottom: 25px;
    }
    
    .resumen-ejecutivo h3 {
      color: #1a472a;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .resumen-ejecutivo p {
      color: #4a5568;
      margin-bottom: 12px;
      text-align: justify;
    }
    
    .resumen-ejecutivo strong {
      color: #1a472a;
    }
    
    .resumen-ejecutivo .destacado {
      background: #1a472a;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    
    /* ============ KPIs PRINCIPALES ============ */
    .kpi-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    
    @media (min-width: 600px) {
      .kpi-container { grid-template-columns: repeat(4, 1fr); }
    }
    
    .kpi-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 18px 15px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }
    
    .kpi-card.verde::before { background: #38a169; }
    .kpi-card.dorado::before { background: #c9a227; }
    .kpi-card.rojo::before { background: #c53030; }
    .kpi-card.naranja::before { background: #dd6b20; }
    .kpi-card.gris::before { background: #718096; }
    .kpi-card.azul::before { background: #2b6cb0; }
    
    .kpi-valor {
      font-size: 32px;
      font-weight: 700;
      color: #1a472a;
      line-height: 1.1;
    }
    
    .kpi-label {
      font-size: 11px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 5px;
    }
    
    .kpi-porcentaje {
      font-size: 12px;
      color: #4a5568;
      margin-top: 3px;
    }
    
    /* ============ SECCIONES ============ */
    .seccion {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    
    .seccion-header {
      background: #f7fafc;
      padding: 15px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .seccion-titulo {
      font-size: 15px;
      font-weight: 700;
      color: #1a472a;
      margin: 0;
    }
    
    .seccion-descripcion {
      font-size: 12px;
      color: #718096;
      margin-top: 4px;
      font-style: normal;
    }
    
    .seccion-body {
      padding: 20px;
    }
    
    /* ============ TABLAS ============ */
    .tabla-datos {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    .tabla-datos th {
      background: #f7fafc;
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .tabla-datos td {
      padding: 12px 10px;
      border-bottom: 1px solid #edf2f7;
      color: #2d3748;
    }
    
    .tabla-datos tr:last-child td {
      border-bottom: none;
    }
    
    .tabla-datos tr:hover {
      background: #f7fafc;
    }
    
    .tabla-datos .numero {
      text-align: right;
      font-weight: 600;
      color: #1a472a;
    }
    
    .tabla-datos .porcentaje {
      text-align: right;
      color: #718096;
      font-size: 12px;
    }
    
    .tabla-datos .indice {
      color: #a0aec0;
      font-weight: 600;
      width: 30px;
    }
    
    /* ============ BARRAS DE PROGRESO ============ */
    .barra-item {
      display: flex;
      align-items: center;
      margin-bottom: 14px;
    }
    
    .barra-item:last-child {
      margin-bottom: 0;
    }
    
    .barra-label {
      width: 130px;
      font-size: 13px;
      color: #4a5568;
      font-weight: 500;
    }
    
    .barra-contenedor {
      flex: 1;
      height: 26px;
      background: #edf2f7;
      border-radius: 4px;
      margin: 0 12px;
      overflow: hidden;
    }
    
    .barra-fill {
      height: 100%;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      color: white;
      font-size: 11px;
      font-weight: 600;
      min-width: 35px;
      transition: width 0.5s ease;
    }
    
    .barra-fill.verde { background: linear-gradient(90deg, #38a169, #48bb78); }
    .barra-fill.amarillo { background: linear-gradient(90deg, #d69e2e, #ecc94b); }
    .barra-fill.naranja { background: linear-gradient(90deg, #dd6b20, #ed8936); }
    .barra-fill.rojo { background: linear-gradient(90deg, #c53030, #e53e3e); }
    .barra-fill.azul { background: linear-gradient(90deg, #2b6cb0, #3182ce); }
    .barra-fill.gris { background: linear-gradient(90deg, #718096, #a0aec0); }
    
    .barra-valor {
      width: 90px;
      text-align: right;
      font-weight: 600;
      font-size: 13px;
      color: #2d3748;
    }
    
    /* ============ ALERTAS ============ */
    .alerta {
      padding: 16px 20px;
      border-radius: 6px;
      margin-bottom: 15px;
      display: flex;
      align-items: flex-start;
    }
    
    .alerta-icono {
      width: 24px;
      height: 24px;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .alerta-contenido {
      flex: 1;
    }
    
    .alerta-titulo {
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .alerta-texto {
      font-size: 13px;
    }
    
    .alerta.critica {
      background: #fff5f5;
      border: 1px solid #feb2b2;
      border-left: 4px solid #c53030;
    }
    .alerta.critica .alerta-titulo { color: #c53030; }
    .alerta.critica .alerta-texto { color: #742a2a; }
    
    .alerta.advertencia {
      background: #fffaf0;
      border: 1px solid #fbd38d;
      border-left: 4px solid #c9a227;
    }
    .alerta.advertencia .alerta-titulo { color: #975a16; }
    .alerta.advertencia .alerta-texto { color: #744210; }
    
    .alerta.info {
      background: #ebf8ff;
      border: 1px solid #90cdf4;
      border-left: 4px solid #2b6cb0;
    }
    .alerta.info .alerta-titulo { color: #2b6cb0; }
    .alerta.info .alerta-texto { color: #2a4365; }
    
    /* ============ CAJA DE DETALLE ============ */
    .detalle-box {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 18px;
      margin-top: 15px;
    }
    
    .detalle-box h4 {
      font-size: 13px;
      font-weight: 700;
      color: #4a5568;
      margin-bottom: 10px;
    }
    
    .detalle-box p {
      font-size: 12px;
      color: #718096;
      line-height: 1.7;
    }
    
    .detalle-box ul {
      margin: 10px 0 0 20px;
      font-size: 12px;
      color: #718096;
    }
    
    .detalle-box li {
      margin-bottom: 6px;
    }
    
    /* ============ GRID DOS COLUMNAS ============ */
    .grid-dos {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    @media (min-width: 600px) {
      .grid-dos { grid-template-columns: 1fr 1fr; }
    }
    
    /* ============ GRÁFICA DE PASTEL (PIE CHART) ============ */
    .pie-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 30px;
      flex-wrap: wrap;
    }
    
    .pie-chart {
      width: 160px;
      height: 160px;
      border-radius: 50%;
      position: relative;
    }
    
    .pie-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .pie-legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
    }
    
    .pie-legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    
    .pie-legend-label {
      color: #4a5568;
    }
    
    .pie-legend-value {
      font-weight: 600;
      color: #1a202c;
      margin-left: auto;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      margin-bottom: 4px;
    }
    
    .legend-color {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
      display: inline-block;
    }
    
    .legend-label {
      color: #333;
    }
    
    /* ============ PIE DE PÁGINA ============ */
    .footer {
      text-align: center;
      padding: 25px 20px;
      background: #f7fafc;
      border-radius: 8px;
      margin-top: 30px;
      border-top: 3px solid #1a472a;
    }
    
    .footer-gobierno {
      font-size: 14px;
      font-weight: 700;
      color: #1a472a;
      margin-bottom: 5px;
    }
    
    .footer-dependencia {
      font-size: 13px;
      color: #4a5568;
      margin-bottom: 15px;
    }
    
    .footer-meta {
      font-size: 11px;
      color: #a0aec0;
    }
    
    .footer-legal {
      font-size: 10px;
      color: #cbd5e0;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
    }
    
    /* ============ IMPRESIÓN ============ */
    @media print {
      body { 
        background: white; 
        font-size: 11px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .container { padding: 0; max-width: 100%; }
      .seccion { page-break-inside: avoid; margin-bottom: 15px; }
      .kpi-container { grid-template-columns: repeat(4, 1fr); }
      .grid-dos { grid-template-columns: 1fr 1fr; }
      .header-institucional { padding: 15px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- ============ ENCABEZADO INSTITUCIONAL ============ -->
    <div class="header-institucional">
      <div class="header-logo">
        <!-- Logo oficial Veracruz -->
        ${logoBase64 ? `<img src="${logoBase64}" alt="Gobierno de Veracruz" style="width: 75px; height: auto; object-fit: contain;" />` : `<div style="text-align: center; color: #c9a227; font-weight: bold; font-size: 18px; line-height: 1.2;">GOBIERNO<br/>DE<br/>VERACRUZ</div>`}
      </div>
      <div class="header-text">
        <h1>Gobierno del Estado de Veracruz</h1>
        <h2>${esAdmin ? 'Sistema DIF Estatal' : nombreSecretaria}</h2>
        <div class="subtitulo">Reporte Ejecutivo de Flota Vehicular</div>
      </div>
      <div class="header-fecha">
        <div>Fecha de generación:</div>
        <div class="fecha-valor">${fechaReporte}</div>
      </div>
    </div>

    <!-- ============ RESUMEN EJECUTIVO ============ -->
    <div class="resumen-ejecutivo">
      <h3>Resumen Ejecutivo</h3>
      <p>
        El ${esAdmin ? 'Sistema DIF Estatal de Veracruz' : nombreSecretaria} administra actualmente una flota de 
        <span class="destacado">${formatNumber(totalVehiculos)} vehículos</span>. 
        De esta flota, <strong>${formatNumber(vehiculosOperando + vehiculosDisponibles)} unidades (${((vehiculosOperando + vehiculosDisponibles) / totalVehiculos * 100).toFixed(1)}%)</strong> se encuentran 
        operativas.
      </p>
      <ul style="margin: 10px 0 15px 20px; color: #4a5568;">
        <li><strong>${formatNumber(vehiculosOperando)} unidades (${porcOperando}%)</strong> en operación activa.</li>
        <li><strong>${formatNumber(vehiculosDisponibles)} unidades</strong> disponibles para asignación.</li>
        <li><strong>${formatNumber(vehiculosMalEstado + propuestosBaja)} unidades</strong> fuera de operación:
          <ul style="margin: 5px 0 5px 20px;">
            <li>${formatNumber(vehiculosMalEstado)} unidades requieren reparación.</li>
            <li>${formatNumber(propuestosBaja)} unidades cuentan con dictamen técnico para baja definitiva.</li>
          </ul>
        </li>
        <li><strong>${formatNumber(vehiculosBaja)} unidades</strong> en proceso de baja administrativa${pendientesSAT > 0 ? `, de las cuales <strong>${formatNumber(pendientesSAT)}</strong> se encuentran pendientes de validación por Hacienda` : ''}.</li>
      </ul>
      <p>
        <strong>Condición física y mecánica:</strong> ${formatNumber(estadoBueno)} vehículos (${porcBueno}%) en condiciones óptimas, 
        ${formatNumber(estadoRegular)} unidades (${porcRegular}%) en estado regular, y 
        ${formatNumber(estadoMalo)} unidades (${porcMalo}%) en condición deficiente.
      </p>
      <p>
        La flota cuenta con vehículos provenientes de <strong>${formatNumber(totalProveedores)} proveedores</strong> distintos,
        con una antigüedad promedio de <strong>${edadPromedio} años</strong>.
      </p>
    </div>

    <!-- ============ KPIs PRINCIPALES ============ -->
    <div class="kpi-container">
      <div class="kpi-card dorado">
        <div class="kpi-valor">${formatNumber(totalVehiculos)}</div>
        <div class="kpi-label">Total Vehículos</div>
      </div>
      <div class="kpi-card verde">
        <div class="kpi-valor">${formatNumber(vehiculosOperando + vehiculosDisponibles)}</div>
        <div class="kpi-label">Operativos</div>
        <div class="kpi-porcentaje">${((vehiculosOperando + vehiculosDisponibles) / totalVehiculos * 100).toFixed(1)}% del total</div>
      </div>
      <div class="kpi-card naranja">
        <div class="kpi-valor">${formatNumber(vehiculosMalEstado)}</div>
        <div class="kpi-label">Mal Estado</div>
        <div class="kpi-porcentaje">Requieren reparación</div>
      </div>
      <div class="kpi-card rojo">
        <div class="kpi-valor">${formatNumber(vehiculosBaja)}</div>
        <div class="kpi-label">Baja</div>
        <div class="kpi-porcentaje">${pendientesSAT > 0 ? `(${formatNumber(pendientesSAT)} pend. Hacienda)` : `${(vehiculosBaja / totalVehiculos * 100).toFixed(1)}% del total`}</div>
      </div>
      ${propuestosBaja > 0 ? `
      <div class="kpi-card gris">
        <div class="kpi-valor">${formatNumber(propuestosBaja)}</div>
        <div class="kpi-label">Dictaminados para Baja</div>
        <div class="kpi-porcentaje">Pendiente trámite</div>
      </div>
      ` : ''}
    </div>

    <!-- ============ ESTADO OPERATIVO ============ -->
    <div class="seccion">
      <div class="seccion-header">
        <h3 class="seccion-titulo">Estado Operativo de la Flota</h3>
        <p class="seccion-descripcion">Clasificación de vehículos según su situación actual de uso y disponibilidad</p>
      </div>
      <div class="seccion-body">
        <table class="tabla-datos">
          <thead>
            <tr>
              <th>Situación</th>
              <th class="numero">Unidades</th>
              <th class="porcentaje">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style="color: #28a745;">Operando</strong></td>
              <td class="numero">${formatNumber(vehiculosOperando)}</td>
              <td class="porcentaje">${porcOperando}%</td>
            </tr>
            <tr>
              <td><strong style="color: #1976d2;">Disponible para asignación</strong></td>
              <td class="numero">${formatNumber(vehiculosDisponibles)}</td>
              <td class="porcentaje">${porcDisponible}%</td>
            </tr>
            <tr>
              <td><strong style="color: #f57c00;">Fuera de operación (requieren reparación)</strong></td>
              <td class="numero">${formatNumber(vehiculosMalEstado)}</td>
              <td class="porcentaje">${porcMalEstado}%</td>
            </tr>
            <tr>
              <td><strong style="color: #dc3545;">En proceso de baja administrativa</strong></td>
              <td class="numero">${formatNumber(vehiculosBaja)}</td>
              <td class="porcentaje">${porcBaja}%</td>
            </tr>
            <tr style="background-color: #f0f4f0; font-weight: 600;">
              <td><strong>Total</strong></td>
              <td class="numero"><strong>${formatNumber(totalVehiculos)}</strong></td>
              <td class="porcentaje"><strong>100%</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 15px; padding: 12px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #1976d2;">
          <p style="margin: 0; font-size: 11px; color: #333;">
            <strong>📋 Aclaración técnica:</strong> Las <strong>${formatNumber(propuestosBaja)} unidades</strong> con dictamen técnico para baja definitiva 
            ya están incluidas dentro de las ${formatNumber(vehiculosBaja)} en proceso de baja administrativa. 
            No se cuentan como categoría independiente para evitar duplicidad.
          </p>
        </div>
      </div>
    </div>

    <!-- ============ CONDICIÓN FÍSICA Y RÉGIMEN ============ -->
    <div class="grid-dos">
      <div class="seccion">
        <div class="seccion-header">
          <h3 class="seccion-titulo">Condición Física</h3>
          <p class="seccion-descripcion">Estado mecánico y de carrocería</p>
        </div>
        <div class="seccion-body">
          <div class="pie-container">
            <div class="pie-chart" style="background: conic-gradient(
              #38a169 0% ${porcBueno}%, 
              #ecc94b ${porcBueno}% ${parseFloat(porcBueno) + parseFloat(porcRegular)}%, 
              #e53e3e ${parseFloat(porcBueno) + parseFloat(porcRegular)}% ${parseFloat(porcBueno) + parseFloat(porcRegular) + parseFloat(porcMalo)}%,
              #9e9e9e ${parseFloat(porcBueno) + parseFloat(porcRegular) + parseFloat(porcMalo)}% 100%
            );"></div>
            <div class="pie-legend">
              <div class="pie-legend-item">
                <div class="pie-legend-color" style="background: #38a169;"></div>
                <span class="pie-legend-label">Bueno</span>
                <span class="pie-legend-value">${formatNumber(estadoBueno)} (${porcBueno}%)</span>
              </div>
              <div class="pie-legend-item">
                <div class="pie-legend-color" style="background: #ecc94b;"></div>
                <span class="pie-legend-label">Regular</span>
                <span class="pie-legend-value">${formatNumber(estadoRegular)} (${porcRegular}%)</span>
              </div>
              <div class="pie-legend-item">
                <div class="pie-legend-color" style="background: #e53e3e;"></div>
                <span class="pie-legend-label">Malo</span>
                <span class="pie-legend-value">${formatNumber(estadoMalo)} (${porcMalo}%)</span>
              </div>
              ${estadoSinEspecificar > 0 ? `
              <div class="pie-legend-item">
                <div class="pie-legend-color" style="background: #9e9e9e;"></div>
                <span class="pie-legend-label">Sin especificar</span>
                <span class="pie-legend-value">${formatNumber(estadoSinEspecificar)} (${totalVehiculos > 0 ? ((estadoSinEspecificar/totalVehiculos)*100).toFixed(1) : 0}%)</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
      
      <div class="seccion">
        <div class="seccion-header">
          <h3 class="seccion-titulo">Situación Jurídica</h3>
          <p class="seccion-descripcion">Clasificación patrimonial de la flota</p>
        </div>
        <div class="seccion-body">
          <div class="pie-container">
            <div class="pie-chart" style="background: conic-gradient(
              #1a472a 0% ${totalVehiculos > 0 ? ((vehiculosPropios/totalVehiculos)*100).toFixed(1) : 0}%, 
              #667eea ${totalVehiculos > 0 ? ((vehiculosPropios/totalVehiculos)*100).toFixed(1) : 0}% 100%
            );"></div>
            <div class="pie-legend">
              <div class="pie-legend-item">
                <div class="pie-legend-color" style="background: #1a472a;"></div>
                <span class="pie-legend-label">Propios</span>
                <span class="pie-legend-value">${formatNumber(vehiculosPropios)} (${totalVehiculos > 0 ? ((vehiculosPropios/totalVehiculos)*100).toFixed(1) : 0}%)</span>
              </div>
              <div class="pie-legend-item">
                <div class="pie-legend-color" style="background: #667eea;"></div>
                <span class="pie-legend-label">En Comodato</span>
                <span class="pie-legend-value">${formatNumber(vehiculosComodato)} (${totalVehiculos > 0 ? ((vehiculosComodato/totalVehiculos)*100).toFixed(1) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ ESTADO DE SEGUROS (DETALLADO) ============ -->
    <div class="seccion">
      <div class="seccion-header">
        <h3 class="seccion-titulo">Estado de Pólizas de Seguro</h3>
        <p class="seccion-descripcion">Análisis de vigencia de coberturas de seguro vehicular</p>
      </div>
      <div class="seccion-body">
        
        <!-- Alertas de Seguros -->
        ${segurosVencidos > 0 ? `
        <div class="alerta critica" style="margin-bottom: 20px;">
          <div class="alerta-icono" style="font-size: 32px;">⚠️</div>
          <div class="alerta-contenido">
            <div class="alerta-titulo">Atención Inmediata: Pólizas de Seguro Vencidas</div>
            <div class="alerta-texto">
              Se identificaron <strong>${formatNumber(segurosVencidos)} vehículos</strong> (${porcSegurosVencidos}% de la flota) 
              con póliza de seguro vencida. Estos vehículos representan un riesgo legal y patrimonial y requieren 
              gestión prioritaria para la renovación de sus coberturas.
            </div>
          </div>
        </div>
        ` : ''}
        
        ${segurosPorVencer > 0 ? `
        <div class="alerta advertencia" style="margin-bottom: 20px;">
          <div class="alerta-icono" style="font-size: 32px;">⏰</div>
          <div class="alerta-contenido">
            <div class="alerta-titulo">Próximas Renovaciones de Seguro</div>
            <div class="alerta-texto">
              <strong>${formatNumber(segurosPorVencer)} vehículos</strong> tienen su póliza de seguro 
              por vencer en los próximos 30 días. Se recomienda iniciar el proceso de renovación 
              para evitar lapsos de cobertura.
            </div>
          </div>
        </div>
        ` : ''}
      
        <h4 style="color: #1a472a; margin-bottom: 15px; font-size: 14px;">Estado de Cobertura de Seguros</h4>
        <table class="tabla-datos">
          <thead>
            <tr>
              <th>Estado</th>
              <th class="numero">Vehículos</th>
              <th class="porcentaje">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style="color: #38a169;">Vigentes</strong> — Seguro activo (vence después de 30 días)</td>
              <td class="numero">${formatNumber(segurosVigentes)}</td>
              <td class="porcentaje">${porcSegurosVigentes}%</td>
            </tr>
            <tr>
              <td><strong style="color: #c9a227;">Por Vencer</strong> — Seguro vence en los próximos 30 días</td>
              <td class="numero">${formatNumber(segurosPorVencer)}</td>
              <td class="porcentaje">${totalVehiculos > 0 ? ((segurosPorVencer/totalVehiculos)*100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><strong style="color: #c53030;">Vencidos</strong> — Seguro con fecha de vigencia pasada</td>
              <td class="numero">${formatNumber(segurosVencidos)}</td>
              <td class="porcentaje">${porcSegurosVencidos}%</td>
            </tr>
            <tr>
              <td><strong style="color: #718096;">Sin Información</strong> — Sin fecha de vigencia registrada o No Aplica</td>
              <td class="numero">${formatNumber(segurosNA)}</td>
              <td class="porcentaje">${porcSegurosNA}%</td>
            </tr>
            <tr style="background-color: #f0f4f0; font-weight: 600;">
              <td>TOTAL FLOTA</td>
              <td class="numero">${formatNumber(totalVehiculos)}</td>
              <td class="porcentaje">100%</td>
            </tr>
          </tbody>
        </table>
        
        ${vehiculosConAseguradora > 0 ? `
        <h4 style="color: #1a472a; margin: 25px 0 15px 0; font-size: 14px;">Compañía Aseguradora</h4>
        <table class="tabla-datos">
          <thead>
            <tr>
              <th>Aseguradora</th>
              <th class="numero">Vehículos Asegurados</th>
              <th class="porcentaje">% de Flota</th>
            </tr>
          </thead>
          <tbody>
            ${topAseguradoras.map(([aseg, cant]) => `
            <tr>
              <td><strong style="color: #1a472a;">${aseg}</strong></td>
              <td class="numero">${formatNumber(cant)}</td>
              <td class="porcentaje">${totalVehiculos > 0 ? ((cant/totalVehiculos)*100).toFixed(1) : 0}%</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        
        <div class="detalle-box">
          <h4>Nota sobre Vehículos sin Información de Seguro</h4>
          <p>
            Los <strong>${formatNumber(segurosNA)} vehículos clasificados como "Sin Información"</strong> 
            (${porcSegurosNA}% de la flota) incluyen:
          </p>
          <ul>
            <li><strong>Vehículos en comodato:</strong> El seguro es responsabilidad de la dependencia que presta el vehículo.</li>
            <li><strong>Vehículos dictaminados para baja:</strong> Unidades fuera de operación.</li>
            <li><strong>Información pendiente:</strong> Datos no capturados en el sistema origen.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============ TIPOS DE VEHÍCULOS ============ -->
    <div class="seccion">
      <div class="seccion-header">
        <h3 class="seccion-titulo">Composición de la Flota por Tipo de Vehículo</h3>
        <p class="seccion-descripcion">Clasificación según el tipo de unidad vehicular</p>
      </div>
      <div class="seccion-body">
        <div class="pie-container">
          <div class="pie-chart" style="background: conic-gradient(${(() => {
            const colores = ['#2e7d32', '#1976d2', '#f57c00', '#9c27b0', '#e91e63', '#00acc1', '#8d6e63', '#607d8b'];
            let parts = [];
            let angle = 0;
            tiposVehiculo.forEach((t, i) => {
              const pct = totalVehiculos > 0 ? (t.cantidad / totalVehiculos) * 100 : 0;
              const next = angle + (pct * 3.6);
              parts.push(colores[i % colores.length] + ' ' + angle + 'deg ' + next + 'deg');
              angle = next;
            });
            return parts.join(', ');
          })()});"></div>
          <div class="pie-legend">
            ${tiposVehiculo.map((t, i) => {
              const colores = ['#2e7d32', '#1976d2', '#f57c00', '#9c27b0', '#e91e63', '#00acc1', '#8d6e63', '#607d8b'];
              const iconos = {'Van':'🚐','Pickup':'🛻','Sedán':'🚗','SUV':'🚙','Camioneta':'🛻','Autobús':'🚌','Motocicleta':'🏍️','Emergencia':'🚑','Otro':'🚗'};
              const icono = iconos[t.tipo_nombre] || '🚗';
              const pct = totalVehiculos > 0 ? ((t.cantidad/totalVehiculos)*100).toFixed(1) : 0;
              return `
            <div class="legend-item">
              <span class="legend-color" style="background-color: ${colores[i % colores.length]};"></span>
              <span class="legend-label">${icono} ${t.tipo_nombre}: <strong>${formatNumber(t.cantidad)}</strong> (${pct}%)</span>
            </div>`;
            }).join('')}
            <div class="legend-item" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
              <span class="legend-color" style="background-color: #333;"></span>
              <span class="legend-label" style="font-weight: bold;">TOTAL: ${formatNumber(totalVehiculos)} vehículos</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ DISTRIBUCIÓN GEOGRÁFICA ============ -->
    <div class="seccion" style="page-break-before: always;">
      <div class="seccion-header">
        <h3 class="seccion-titulo">📍 Distribución por Municipios</h3>
        <p class="seccion-descripcion">Cobertura de la flota vehicular del DIF en ${municipios.length} municipios del Estado de Veracruz</p>
      </div>
      <div class="seccion-body">
        <!-- Resumen estadístico de municipios -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; text-align: center;">
          <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; border-left: 4px solid #28a745;">
            <div style="font-size: 28px; font-weight: bold; color: #28a745;">${municipios.filter(m => m.operando > 0 && m.operando === m.total).length}</div>
            <div style="font-size: 11px; color: #666;">Municipios 100% operativos</div>
          </div>
          <div style="background: #fff8e1; padding: 12px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <div style="font-size: 28px; font-weight: bold; color: #f57c00;">${municipios.filter(m => m.operando > 0 && m.operando < m.total).length}</div>
            <div style="font-size: 11px; color: #666;">Municipios con flota mixta</div>
          </div>
          <div style="background: #ffebee; padding: 12px; border-radius: 8px; border-left: 4px solid #dc3545;">
            <div style="font-size: 28px; font-weight: bold; color: #dc3545;">${municipios.filter(m => m.operando === 0).length}</div>
            <div style="font-size: 11px; color: #666;">Sin unidades operativas</div>
          </div>
          <div style="background: #e3f2fd; padding: 12px; border-radius: 8px; border-left: 4px solid #1976d2;">
            <div style="font-size: 28px; font-weight: bold; color: #1976d2;">${formatNumber(municipios.reduce((s, m) => s + m.total, 0))}</div>
            <div style="font-size: 11px; color: #666;">Vehículos en municipios</div>
          </div>
        </div>

        <!-- Gráfica de pastel para Top 10 municipios -->
        <div style="display: flex; align-items: flex-start; justify-content: center; gap: 30px; margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 12px;">
          <div style="width: 200px; height: 200px; border-radius: 50%; background: conic-gradient(${(() => {
            const colores = ['#1a472a', '#2e7d32', '#43a047', '#66bb6a', '#81c784', '#1565c0', '#1976d2', '#42a5f5', '#f57c00', '#ff9800'];
            const totalMunicipios = municipios.reduce((s, m) => s + m.total, 0);
            let parts = [];
            let angle = 0;
            const top10 = municipios.sort((a,b) => b.total - a.total).slice(0, 10);
            const otrosCant = municipios.slice(10).reduce((s, m) => s + m.total, 0);
            top10.forEach((m, i) => {
              const pct = totalMunicipios > 0 ? (m.total / totalMunicipios) * 100 : 0;
              const next = angle + (pct * 3.6);
              parts.push(colores[i] + ' ' + angle + 'deg ' + next + 'deg');
              angle = next;
            });
            if (otrosCant > 0) {
              parts.push('#bdbdbd ' + angle + 'deg 360deg');
            }
            return parts.join(', ');
          })()}); box-shadow: 0 4px 15px rgba(0,0,0,0.15);"></div>
          <div style="display: flex; flex-direction: column; gap: 5px;">
            ${municipios.sort((a,b) => b.total - a.total).slice(0, 10).map((m, i) => {
              const colores = ['#1a472a', '#2e7d32', '#43a047', '#66bb6a', '#81c784', '#1565c0', '#1976d2', '#42a5f5', '#f57c00', '#ff9800'];
              const totalMunicipios = municipios.reduce((s, m) => s + m.total, 0);
              const pct = totalMunicipios > 0 ? ((m.total/totalMunicipios)*100).toFixed(1) : 0;
              return `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 12px; height: 12px; border-radius: 50%; background-color: ${colores[i]}; display: inline-block; flex-shrink: 0;"></span>
              <span style="font-size: 10px; min-width: 140px;"><strong>${m.municipio.substring(0, 20)}${m.municipio.length > 20 ? '...' : ''}</strong></span>
              <span style="font-size: 11px; font-weight: bold;">${formatNumber(m.total)}</span>
              <span style="font-size: 9px; color: #666;">(${pct}%)</span>
            </div>`;
            }).join('')}
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; padding-top: 5px; border-top: 1px solid #ddd;">
              <span style="width: 12px; height: 12px; border-radius: 50%; background-color: #bdbdbd; display: inline-block; flex-shrink: 0;"></span>
              <span style="font-size: 10px; min-width: 140px;"><strong>Otros (${municipios.length - 10 > 0 ? municipios.length - 10 : 0} mun.)</strong></span>
              <span style="font-size: 11px; font-weight: bold;">${formatNumber(municipios.slice(10).reduce((s, m) => s + m.total, 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ DISTRIBUCIÓN POR DEPENDENCIAS ============ -->
    <div class="seccion">
      <div class="seccion-header">
        <h3 class="seccion-titulo">🏛️ Distribución por Dependencias</h3>
        <p class="seccion-descripcion">Vehículos asignados a ${dependencias.length} oficinas centrales, CAS, CRIS y otras dependencias</p>
      </div>
      <div class="seccion-body">
        <!-- Resumen de dependencias -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; text-align: center;">
          <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; border-left: 4px solid #28a745;">
            <div style="font-size: 28px; font-weight: bold; color: #28a745;">${dependencias.reduce((s, d) => s + d.operando, 0)}</div>
            <div style="font-size: 11px; color: #666;">Operando</div>
          </div>
          <div style="background: #fff3e0; padding: 12px; border-radius: 8px; border-left: 4px solid #f57c00;">
            <div style="font-size: 28px; font-weight: bold; color: #f57c00;">${dependencias.reduce((s, d) => s + d.mal_estado, 0)}</div>
            <div style="font-size: 11px; color: #666;">Mal Estado</div>
          </div>
          <div style="background: #ffebee; padding: 12px; border-radius: 8px; border-left: 4px solid #dc3545;">
            <div style="font-size: 28px; font-weight: bold; color: #dc3545;">${dependencias.reduce((s, d) => s + d.baja, 0)}</div>
            <div style="font-size: 11px; color: #666;">En Baja</div>
          </div>
          <div style="background: #e3f2fd; padding: 12px; border-radius: 8px; border-left: 4px solid #1976d2;">
            <div style="font-size: 28px; font-weight: bold; color: #1976d2;">${formatNumber(dependencias.reduce((s, d) => s + d.total, 0))}</div>
            <div style="font-size: 11px; color: #666;">Total en dependencias</div>
          </div>
        </div>

        <!-- Tabla de dependencias -->
        <table class="tabla-datos" style="font-size: 10px;">
          <thead>
            <tr>
              <th>Dependencia</th>
              <th class="numero">Total</th>
              <th class="numero" style="color: #28a745;">Op.</th>
              <th class="numero" style="color: #f57c00;">Mal Est.</th>
              <th class="numero" style="color: #dc3545;">Baja</th>
            </tr>
          </thead>
          <tbody>
            ${dependencias.map(d => `
            <tr>
              <td style="font-size: 9px;"><strong>${d.nombre.substring(0, 45)}${d.nombre.length > 45 ? '...' : ''}</strong></td>
              <td class="numero">${formatNumber(d.total)}</td>
              <td class="numero" style="color: #28a745;">${formatNumber(d.operando)}</td>
              <td class="numero" style="color: #f57c00;">${formatNumber(d.mal_estado)}</td>
              <td class="numero" style="color: #dc3545;">${formatNumber(d.baja)}</td>
            </tr>
            `).join('')}
            <tr style="background-color: #f0f4f0; font-weight: 600;">
              <td><strong>TOTAL DEPENDENCIAS</strong></td>
              <td class="numero">${formatNumber(dependencias.reduce((s, d) => s + d.total, 0))}</td>
              <td class="numero" style="color: #28a745;">${formatNumber(dependencias.reduce((s, d) => s + d.operando, 0))}</td>
              <td class="numero" style="color: #f57c00;">${formatNumber(dependencias.reduce((s, d) => s + d.mal_estado, 0))}</td>
              <td class="numero" style="color: #dc3545;">${formatNumber(dependencias.reduce((s, d) => s + d.baja, 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============ ANTIGÜEDAD DE LA FLOTA ============ -->
    <div class="seccion">
      <div class="seccion-header">
        <h3 class="seccion-titulo">Antigüedad de la Flota</h3>
        <p class="seccion-descripcion">Clasificación por año de fabricación — Antigüedad promedio: ${edadPromedio} años</p>
      </div>
      <div class="seccion-body">
        <table class="tabla-datos">
          <thead>
            <tr>
              <th>Clasificación</th>
              <th>Rango de Años</th>
              <th class="numero">Vehículos</th>
              <th class="porcentaje">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style="color: #38a169;">Recientes</strong></td>
              <td>${anioActual - 5} a ${anioActual}</td>
              <td class="numero">${formatNumber(vehiculosNuevos)}</td>
              <td class="porcentaje">${totalVehiculos > 0 ? ((vehiculosNuevos/totalVehiculos)*100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><strong style="color: #c9a227;">Medianos</strong></td>
              <td>${anioActual - 10} a ${anioActual - 6}</td>
              <td class="numero">${formatNumber(vehiculosMedianos)}</td>
              <td class="porcentaje">${totalVehiculos > 0 ? ((vehiculosMedianos/totalVehiculos)*100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><strong style="color: #c53030;">Antiguos</strong></td>
              <td>Antes de ${anioActual - 10}</td>
              <td class="numero">${formatNumber(vehiculosAntiguos)}</td>
              <td class="porcentaje">${totalVehiculos > 0 ? ((vehiculosAntiguos/totalVehiculos)*100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============ MARCAS Y PROVEEDORES ============ -->
    <div class="grid-dos">
      <div class="seccion">
        <div class="seccion-header">
          <h3 class="seccion-titulo">Principales Marcas</h3>
          <p class="seccion-descripcion">Top 3 marcas de vehículos</p>
        </div>
        <div class="seccion-body">
          <div class="pie-container">
            <div class="pie-chart" style="background: conic-gradient(${(() => {
              const colores = ['#2e7d32', '#1976d2', '#f57c00', '#e0e0e0'];
              let parts = [];
              let angle = 0;
              // Mostrar top 3 + otros en el pastel
              const top3 = topMarcas.slice(0, 3);
              const otrosCant = topMarcas.slice(3).reduce((s, m) => s + m.cantidad, 0);
              top3.forEach((m, i) => {
                const pct = totalVehiculos > 0 ? (m.cantidad / totalVehiculos) * 100 : 0;
                const next = angle + (pct * 3.6);
                parts.push(colores[i] + ' ' + angle + 'deg ' + next + 'deg');
                angle = next;
              });
              if (otrosCant > 0) {
                const pctOtros = totalVehiculos > 0 ? (otrosCant / totalVehiculos) * 100 : 0;
                const next = angle + (pctOtros * 3.6);
                parts.push('#e0e0e0 ' + angle + 'deg ' + next + 'deg');
              }
              return parts.join(', ');
            })()});"></div>
            <div class="pie-legend">
              ${topMarcas.slice(0, 3).map((m, i) => {
                const colores = ['#2e7d32', '#1976d2', '#f57c00'];
                const pct = totalVehiculos > 0 ? ((m.cantidad/totalVehiculos)*100).toFixed(1) : 0;
                return `
              <div class="legend-item">
                <span class="legend-color" style="background-color: ${colores[i]};"></span>
                <span class="legend-label">${m.marca || 'Sin marca'}: <strong>${formatNumber(m.cantidad)}</strong> (${pct}%)</span>
              </div>`;
              }).join('')}
              ${topMarcas.length > 3 ? `
              <div class="legend-item">
                <span class="legend-color" style="background-color: #e0e0e0;"></span>
                <span class="legend-label">Otros (${topMarcas.length - 3} marcas): <strong>${formatNumber(topMarcas.slice(3).reduce((s, m) => s + m.cantidad, 0))}</strong></span>
              </div>` : ''}
            </div>
          </div>
          <!-- Tabla de marcas -->
          <table class="tabla-datos" style="margin-top: 15px; font-size: 10px;">
            <thead>
              <tr>
                <th>#</th>
                <th>Marca</th>
                <th class="numero">Cantidad</th>
                <th class="porcentaje">%</th>
              </tr>
            </thead>
            <tbody>
              ${topMarcas.slice(0, 3).map((m, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${m.marca || 'Sin marca'}</strong></td>
                <td class="numero">${formatNumber(m.cantidad)}</td>
                <td class="porcentaje">${totalVehiculos > 0 ? ((m.cantidad/totalVehiculos)*100).toFixed(1) : 0}%</td>
              </tr>
              `).join('')}
              ${topMarcas.length > 3 ? `
              <tr style="background-color: #f5f5f5;">
                <td></td>
                <td>Otras marcas (${topMarcas.length - 3})</td>
                <td class="numero">${formatNumber(topMarcas.slice(3).reduce((s, m) => s + m.cantidad, 0))}</td>
                <td class="porcentaje">${totalVehiculos > 0 ? ((topMarcas.slice(3).reduce((s, m) => s + m.cantidad, 0)/totalVehiculos)*100).toFixed(1) : 0}%</td>
              </tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="seccion">
        <div class="seccion-header">
          <h3 class="seccion-titulo">Principales Proveedores</h3>
          <p class="seccion-descripcion">Top 3 de ${formatNumber(totalProveedores)} proveedores</p>
        </div>
        <div class="seccion-body">
          <div class="pie-container">
            <div class="pie-chart" style="background: conic-gradient(${(() => {
              const colores = ['#1976d2', '#e91e63', '#ff9800', '#e0e0e0'];
              let parts = [];
              let angle = 0;
              const top3 = topProveedores.slice(0, 3);
              const otrosCant = topProveedores.slice(3).reduce((s, p) => s + p.cantidad, 0);
              top3.forEach((p, i) => {
                const pct = totalVehiculos > 0 ? (p.cantidad / totalVehiculos) * 100 : 0;
                const next = angle + (pct * 3.6);
                parts.push(colores[i] + ' ' + angle + 'deg ' + next + 'deg');
                angle = next;
              });
              if (otrosCant > 0) {
                const pctOtros = totalVehiculos > 0 ? (otrosCant / totalVehiculos) * 100 : 0;
                const next = angle + (pctOtros * 3.6);
                parts.push('#e0e0e0 ' + angle + 'deg ' + next + 'deg');
              }
              return parts.join(', ');
            })()});"></div>
            <div class="pie-legend">
              ${topProveedores.slice(0, 3).map((p, i) => {
                const colores = ['#1976d2', '#e91e63', '#ff9800'];
                const pct = totalVehiculos > 0 ? ((p.cantidad/totalVehiculos)*100).toFixed(1) : 0;
                return `
              <div class="legend-item">
                <span class="legend-color" style="background-color: ${colores[i]};"></span>
                <span class="legend-label" style="font-size: 10px;">${p.proveedor_arrendadora.substring(0,25)}${p.proveedor_arrendadora.length > 25 ? '...' : ''}: <strong>${formatNumber(p.cantidad)}</strong> (${pct}%)</span>
              </div>`;
              }).join('')}
              ${topProveedores.length > 3 ? `
              <div class="legend-item">
                <span class="legend-color" style="background-color: #e0e0e0;"></span>
                <span class="legend-label" style="font-size: 10px;">Otros (${topProveedores.length - 3} proveedores): <strong>${formatNumber(topProveedores.slice(3).reduce((s, p) => s + p.cantidad, 0))}</strong></span>
              </div>` : ''}
            </div>
          </div>
          <!-- Tabla de proveedores -->
          <table class="tabla-datos" style="margin-top: 15px; font-size: 10px;">
            <thead>
              <tr>
                <th>#</th>
                <th>Proveedor</th>
                <th class="numero">Cantidad</th>
                <th class="porcentaje">%</th>
              </tr>
            </thead>
            <tbody>
              ${topProveedores.slice(0, 3).map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${p.proveedor_arrendadora.substring(0,30)}${p.proveedor_arrendadora.length > 30 ? '...' : ''}</strong></td>
                <td class="numero">${formatNumber(p.cantidad)}</td>
                <td class="porcentaje">${totalVehiculos > 0 ? ((p.cantidad/totalVehiculos)*100).toFixed(1) : 0}%</td>
              </tr>
              `).join('')}
              ${topProveedores.length > 3 ? `
              <tr style="background-color: #f5f5f5;">
                <td></td>
                <td>Otros proveedores (${topProveedores.length - 3})</td>
                <td class="numero">${formatNumber(topProveedores.slice(3).reduce((s, p) => s + p.cantidad, 0))}</td>
                <td class="porcentaje">${totalVehiculos > 0 ? ((topProveedores.slice(3).reduce((s, p) => s + p.cantidad, 0)/totalVehiculos)*100).toFixed(1) : 0}%</td>
              </tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ============ RESUMEN FINAL ============ -->
    <div class="seccion">
      <div class="seccion-header">
        <h3 class="seccion-titulo">Indicadores Clave de Gestión</h3>
        <p class="seccion-descripcion">Resumen de las métricas principales de la flota vehicular</p>
      </div>
      <div class="seccion-body">
        <!-- Categoría: Operación -->
        <h4 style="color: #28a745; margin: 0 0 10px 0; font-size: 12px; border-bottom: 2px solid #28a745; padding-bottom: 5px;">🚗 OPERACIÓN Y ESTADO</h4>
        <table class="tabla-datos" style="margin-bottom: 20px;">
          <tbody>
            <tr>
              <td><strong>Total de Vehículos en Flota</strong></td>
              <td class="numero"><strong>${formatNumber(totalVehiculos)}</strong></td>
            </tr>
            <tr>
              <td>Vehículos en Operación Activa</td>
              <td class="numero" style="color: #28a745;">${formatNumber(vehiculosOperando)} (${porcOperando}%)</td>
            </tr>
            <tr>
              <td>Vehículos en Condición Óptima</td>
              <td class="numero" style="color: #28a745;">${formatNumber(estadoBueno)} (${porcBueno}%)</td>
            </tr>
            <tr>
              <td>Vehículos en Estado Regular</td>
              <td class="numero" style="color: #f57c00;">${formatNumber(estadoRegular)} (${totalVehiculos > 0 ? ((estadoRegular/totalVehiculos)*100).toFixed(1) : 0}%)</td>
            </tr>
            <tr>
              <td>Vehículos en Mal Estado</td>
              <td class="numero" style="color: #dc3545;">${formatNumber(vehiculosMalEstado)} (${totalVehiculos > 0 ? ((vehiculosMalEstado/totalVehiculos)*100).toFixed(1) : 0}%)</td>
            </tr>
          </tbody>
        </table>

        <!-- Categoría: Seguros -->
        <h4 style="color: #1976d2; margin: 0 0 10px 0; font-size: 12px; border-bottom: 2px solid #1976d2; padding-bottom: 5px;">🛡️ SEGUROS</h4>
        <table class="tabla-datos" style="margin-bottom: 20px;">
          <tbody>
            <tr>
              <td>Vehículos con Seguro Vigente</td>
              <td class="numero" style="color: #28a745;">${formatNumber(segurosVigentes)} (${porcSegurosVigentes}%)</td>
            </tr>
            <tr>
              <td>Vehículos con Seguro Por Vencer (30 días)</td>
              <td class="numero" style="color: #f57c00;">${formatNumber(segurosPorVencer)} (${totalVehiculos > 0 ? ((segurosPorVencer/totalVehiculos)*100).toFixed(1) : 0}%)</td>
            </tr>
            <tr>
              <td>Vehículos con Seguro Vencido</td>
              <td class="numero" style="color: #dc3545;">${formatNumber(segurosVencidos)} (${porcSegurosVencidos}%)</td>
            </tr>
            <tr>
              <td>Vehículos Sin Información de Seguro</td>
              <td class="numero" style="color: #666;">${formatNumber(segurosNA)} (${porcSegurosNA}%)</td>
            </tr>
          </tbody>
        </table>

        <!-- Categoría: Bajas -->
        <h4 style="color: #dc3545; margin: 0 0 10px 0; font-size: 12px; border-bottom: 2px solid #dc3545; padding-bottom: 5px;">📋 BAJAS Y DETERMINACIÓN</h4>
        <table class="tabla-datos" style="margin-bottom: 20px;">
          <tbody>
            <tr>
              <td>Vehículos Dictaminados para Baja</td>
              <td class="numero" style="color: #dc3545;">${formatNumber(propuestosBaja)}</td>
            </tr>
            <tr>
              <td>Pendientes de Determinación (Hacienda)</td>
              <td class="numero" style="color: #f57c00;">${formatNumber(pendientesHacienda)}</td>
            </tr>
            <tr>
              <td>Total Vehículos en Proceso de Baja</td>
              <td class="numero"><strong>${formatNumber(propuestosBaja + pendientesHacienda)}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Categoría: Información General -->
        <h4 style="color: #6c757d; margin: 0 0 10px 0; font-size: 12px; border-bottom: 2px solid #6c757d; padding-bottom: 5px;">📊 INFORMACIÓN GENERAL</h4>
        <table class="tabla-datos">
          <tbody>
            <tr>
              <td>Antigüedad Promedio de la Flota</td>
              <td class="numero">${edadPromedio} años</td>
            </tr>
            <tr>
              <td>Municipios/Ubicaciones con Vehículos</td>
              <td class="numero">${formatNumber(municipios.length)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============ PIE DE PÁGINA ============ -->
    <div class="footer">
      <div class="footer-gobierno">Gobierno del Estado de Veracruz de Ignacio de la Llave</div>
      <div class="footer-dependencia">${esAdmin ? 'Sistema para el Desarrollo Integral de la Familia' : nombreSecretaria}</div>
      <div class="footer-dependencia" style="margin-bottom: 5px;">Sistema de Control y Administración de Flota Vehicular</div>
      <div class="footer-meta">
        Documento generado el ${fechaHora}
      </div>
      <div class="footer-legal">
        La información contenida en este documento es de carácter oficial y corresponde al momento de su generación. 
        Los datos están sujetos a actualización conforme a los movimientos registrados en el sistema.
        Documento para uso exclusivo de la administración pública estatal.
      </div>
    </div>
    
  </div>
</body>
</html>`;

  return html;
}

module.exports = { generarReporteEjecutivo };
