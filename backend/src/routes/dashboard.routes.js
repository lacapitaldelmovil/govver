/**
 * Rutas del Dashboard - SQLite
 * Usando estructura de columnas del esquema actualizado
 */

const express = require('express');
const { query } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/dashboard/stats
 */
router.get('/stats', authMiddleware, (req, res) => {
  try {
    // Construir filtro de secretaría si aplica
    const secretariaFilter = req.user.rol === 'admin_secretaria' && req.user.secretaria_id
      ? `AND secretaria_id = ${req.user.secretaria_id}`
      : '';
    
    // Total de vehículos
    const totalVehiculos = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 ${secretariaFilter}`);
    
    // Vehículos por estado operativo
    const porEstado = query(`
      SELECT estado_operativo as estado, COUNT(*) as cantidad 
      FROM vehiculos 
      WHERE activo = 1 ${secretariaFilter}
      GROUP BY estado_operativo
    `);
    
    // Vehículos por régimen (Propio, Arrendado, Comodato)
    const porRegimen = query(`
      SELECT regimen, COUNT(*) as cantidad 
      FROM vehiculos 
      WHERE activo = 1 ${secretariaFilter}
      GROUP BY regimen
    `);
    
    // Total secretarías (solo admin y gobernación ven esto)
    const totalSecretarias = ['admin', 'gobernacion'].includes(req.user.rol)
      ? query('SELECT COUNT(*) as total FROM secretarias WHERE activa = 1')
      : { rows: [{ total: 0 }] };
    
    // Solicitudes pendientes
    const solicitudesPendientes = query(`SELECT COUNT(*) as total FROM solicitudes WHERE estado = 'pendiente' ${secretariaFilter.replace('secretaria_id', 'secretaria_origen_id')}`);
    
    // Vehículos en taller
    const enTaller = query(`SELECT COUNT(*) as total FROM vehiculos WHERE estado_operativo = 'En taller' AND activo = 1 ${secretariaFilter}`);
    
    // Vehículos arrendados
    const arrendados = query(`SELECT COUNT(*) as total FROM vehiculos WHERE regimen = 'Arrendado' AND activo = 1 ${secretariaFilter}`);

    // Vehículos propuestos para baja
    const propuestosBaja = query(`SELECT COUNT(*) as total FROM vehiculos WHERE propuesto_baja = 1 AND activo = 1 ${secretariaFilter}`);

    res.json({
      totalVehiculos: totalVehiculos.rows[0]?.total || 0,
      vehiculosPorEstado: porEstado.rows,
      vehiculosPorRegimen: porRegimen.rows,
      vehiculosArrendados: arrendados.rows[0]?.total || 0,
      propuestosBaja: propuestosBaja.rows[0]?.total || 0,
      totalSecretarias: totalSecretarias.rows[0]?.total || 0,
      solicitudesPendientes: solicitudesPendientes.rows[0]?.total || 0,
      vehiculosEnTaller: enTaller.rows[0]?.total || 0
    });
  } catch (error) {
    console.error('Error en dashboard stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

/**
 * GET /api/dashboard/semaforo
 */
router.get('/semaforo', authMiddleware, (req, res) => {
  try {
    const semaforo = query(`
      SELECT 
        s.id,
        s.nombre,
        s.siglas,
        COUNT(v.id) as total_vehiculos,
        SUM(CASE WHEN v.estado_operativo = 'Operando' THEN 1 ELSE 0 END) as operando,
        SUM(CASE WHEN v.estado_operativo = 'En taller' THEN 1 ELSE 0 END) as en_taller,
        SUM(CASE WHEN v.estado_operativo = 'Mal estado' THEN 1 ELSE 0 END) as mal_estado,
        SUM(CASE WHEN v.estado_operativo = 'Baja' THEN 1 ELSE 0 END) as baja,
        SUM(CASE WHEN v.regimen = 'Arrendado' THEN 1 ELSE 0 END) as arrendados,
        SUM(CASE WHEN v.regimen = 'Propio' THEN 1 ELSE 0 END) as propios
      FROM secretarias s
      LEFT JOIN vehiculos v ON s.id = v.secretaria_id AND v.activo = 1
      WHERE s.activa = 1
      GROUP BY s.id, s.nombre, s.siglas
      ORDER BY total_vehiculos DESC
    `);

    const result = semaforo.rows.map(sec => {
      const total = sec.total_vehiculos || 0;
      const operativos = sec.operando || 0;
      
      let eficiencia = 100;
      let color = 'verde';
      
      if (total > 0) {
        eficiencia = Math.round((operativos / total) * 100);
        if (eficiencia >= 80) color = 'verde';
        else if (eficiencia >= 50) color = 'amarillo';
        else color = 'rojo';
      }
      
      return { ...sec, eficiencia, color };
    });

    res.json(result);
  } catch (error) {
    console.error('Error en semáforo:', error);
    res.status(500).json({ error: 'Error al obtener semáforo' });
  }
});

/**
 * GET /api/dashboard/vehiculos-ociosos
 */
router.get('/vehiculos-ociosos', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT v.*, s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
      FROM vehiculos v
      LEFT JOIN secretarias s ON v.secretaria_id = s.id
      WHERE v.estado_operativo = 'Mal estado' AND v.activo = 1
      ORDER BY v.updated_at ASC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo vehículos ociosos:', error);
    res.status(500).json({ error: 'Error al obtener vehículos ociosos' });
  }
});

/**
 * GET /api/dashboard/alertas-rentas
 */
router.get('/alertas-rentas', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT v.*, s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
      FROM vehiculos v
      LEFT JOIN secretarias s ON v.secretaria_id = s.id
      WHERE v.regimen = 'Arrendado' AND v.activo = 1
      ORDER BY v.vigencia_contrato ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo alertas de rentas:', error);
    res.status(500).json({ error: 'Error al obtener alertas de rentas' });
  }
});

/**
 * GET /api/dashboard/resumen-dependencias
 */
router.get('/resumen-dependencias', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT 
        s.id, s.nombre, s.siglas,
        COUNT(v.id) as total_vehiculos,
        SUM(CASE WHEN v.regimen = 'Propio' THEN 1 ELSE 0 END) as propios,
        SUM(CASE WHEN v.regimen = 'Arrendado' THEN 1 ELSE 0 END) as arrendados,
        SUM(CASE WHEN v.regimen = 'Comodato' THEN 1 ELSE 0 END) as comodato,
        SUM(v.renta_mensual) as gasto_mensual_renta
      FROM secretarias s
      LEFT JOIN vehiculos v ON s.id = v.secretaria_id AND v.activo = 1
      WHERE s.activa = 1
      GROUP BY s.id, s.nombre, s.siglas
      ORDER BY total_vehiculos DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

/**
 * Función para parsear fechas en diferentes formatos
 */
function parseFechaSeguro(fechaStr) {
  if (!fechaStr || fechaStr === 'NO APLICA' || fechaStr === 'N/A') return null;
  
  // Limpiar el texto "VENCIDA" si existe
  fechaStr = fechaStr.replace(/\s*VENCIDA\s*/gi, '').trim();
  
  // Formato ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    return new Date(fechaStr);
  }
  
  // Formato DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fechaStr)) {
    const [dia, mes, anio] = fechaStr.split('/');
    return new Date(anio, parseInt(mes) - 1, parseInt(dia));
  }
  
  // Formato M/D/YY (como 1/16/26)
  if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(fechaStr)) {
    const [mes, dia, anio] = fechaStr.split('/');
    const anioCompleto = parseInt(anio) > 50 ? 1900 + parseInt(anio) : 2000 + parseInt(anio);
    return new Date(anioCompleto, parseInt(mes) - 1, parseInt(dia));
  }
  
  // Formato "DD DE MES YYYY" (como "31 DE AGOSTO 2026")
  const meses = {
    'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5,
    'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11
  };
  const matchTexto = fechaStr.toUpperCase().match(/(\d{1,2})\s+DE\s+(\w+)\s+(\d{4})/);
  if (matchTexto) {
    const dia = parseInt(matchTexto[1]);
    const mes = meses[matchTexto[2]];
    const anio = parseInt(matchTexto[3]);
    if (mes !== undefined) {
      return new Date(anio, mes, dia);
    }
  }
  
  return null;
}

/**
 * GET /api/dashboard/alertas-seguros
 * Obtiene TODOS los vehículos con su estado de seguro
 */
router.get('/alertas-seguros', authMiddleware, (req, res) => {
  try {
    const secretariaFilter = req.user.rol === 'admin_secretaria' && req.user.secretaria_id
      ? `AND v.secretaria_id = ${req.user.secretaria_id}`
      : '';
    
    // Consulta para TODOS los vehículos activos (sin excluir ninguno)
    const result = query(`
      SELECT v.id, v.placas, v.marca, v.modelo, v.anio, v.poliza_seguro, v.vigencia_seguro,
             v.estado_operativo, v.clasificacion, s.siglas as secretaria_siglas
      FROM vehiculos v
      LEFT JOIN secretarias s ON v.secretaria_id = s.id
      WHERE v.activo = 1 
        ${secretariaFilter}
    `);
    
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);
    
    // Clasificar CADA vehículo en exactamente UNA categoría
    const categorias = {
      no_aplica: [],
      en_tramite: [],
      sin_seguro: [],
      vencidos: [],
      por_vencer: [],
      vigentes: []
    };
    
    result.rows.forEach(v => {
      const vigencia = (v.vigencia_seguro || '').trim().toUpperCase();
      const poliza = (v.poliza_seguro || '').trim().toUpperCase();
      
      // 1. NO APLICA
      if (vigencia === 'NO APLICA' || vigencia === 'N/A') {
        categorias.no_aplica.push(v);
        return;
      }
      
      // 2. EN TRÁMITE
      if (poliza.includes('TRAMITE') || vigencia.includes('TRAMITE')) {
        categorias.en_tramite.push(v);
        return;
      }
      
      // 3. SIN SEGURO (sin vigencia o sin póliza válida)
      if (!vigencia || vigencia === 'SIN DATO' || !poliza || poliza === 'SIN POLIZA' || poliza === 'SIN DATO') {
        categorias.sin_seguro.push(v);
        return;
      }
      
      // 4. Tiene fecha de vigencia - intentar parsear
      const fechaVenc = parseFechaSeguro(v.vigencia_seguro);
      
      if (!fechaVenc) {
        // No se pudo parsear la fecha - contar como sin seguro
        categorias.sin_seguro.push(v);
        return;
      }
      
      // 5. Clasificar por fecha
      if (fechaVenc < hoy) {
        categorias.vencidos.push({ ...v, estado_seguro: 'vencido', fecha_vencimiento: fechaVenc });
      } else if (fechaVenc <= en30Dias) {
        categorias.por_vencer.push({ ...v, estado_seguro: 'por_vencer', fecha_vencimiento: fechaVenc });
      } else {
        categorias.vigentes.push({ ...v, estado_seguro: 'vigente', fecha_vencimiento: fechaVenc });
      }
    });
    
    // Agregar estado_seguro a las otras categorías
    categorias.no_aplica = categorias.no_aplica.map(v => ({ ...v, estado_seguro: 'no_aplica' }));
    categorias.en_tramite = categorias.en_tramite.map(v => ({ ...v, estado_seguro: 'en_tramite' }));
    categorias.sin_seguro = categorias.sin_seguro.map(v => ({ ...v, estado_seguro: 'sin_seguro' }));
    
    // Estadísticas completas
    const stats = {
      total: result.rows.length,
      vencidos: categorias.vencidos.length,
      por_vencer: categorias.por_vencer.length,
      vigentes: categorias.vigentes.length,
      en_tramite: categorias.en_tramite.length,
      no_aplica: categorias.no_aplica.length,
      sin_seguro: categorias.sin_seguro.length
    };
    
    // Todos los vehículos categorizados
    const todosVehiculos = [
      ...categorias.vencidos,
      ...categorias.por_vencer,
      ...categorias.vigentes,
      ...categorias.en_tramite,
      ...categorias.sin_seguro,
      ...categorias.no_aplica
    ];
    
    res.json({
      stats,
      vehiculos: todosVehiculos
    });
  } catch (error) {
    console.error('Error obteniendo alertas de seguros:', error);
    res.status(500).json({ error: 'Error al obtener alertas de seguros' });
  }
});

/**
 * GET /api/dashboard/municipios-stats
 * Obtiene estadísticas de vehículos por municipio y dependencias
 */
router.get('/municipios-stats', authMiddleware, (req, res) => {
  try {
    const secretariaFilter = req.user.rol === 'admin_secretaria' && req.user.secretaria_id
      ? `AND v.secretaria_id = ${req.user.secretaria_id}`
      : '';
    
    const result = query(`
      SELECT 
        v.municipio,
        COUNT(*) as total,
        SUM(CASE WHEN v.estado_operativo = 'Operando' THEN 1 ELSE 0 END) as operando,
        SUM(CASE WHEN v.estado_operativo = 'Disponible' THEN 1 ELSE 0 END) as disponible,
        SUM(CASE WHEN v.estado_operativo = 'Mal estado' THEN 1 ELSE 0 END) as mal_estado,
        SUM(CASE WHEN v.estado_operativo = 'En taller' THEN 1 ELSE 0 END) as en_taller,
        SUM(CASE WHEN v.estado_operativo = 'Baja' THEN 1 ELSE 0 END) as baja,
        COALESCE(v.es_dependencia, 0) as es_dependencia
      FROM vehiculos v
      WHERE v.activo = 1 
        AND v.municipio IS NOT NULL 
        AND v.municipio != ''
        ${secretariaFilter}
      GROUP BY v.municipio, v.es_dependencia
      ORDER BY v.es_dependencia, v.municipio
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo estadísticas por municipio:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas por municipio' });
  }
});

module.exports = router;
