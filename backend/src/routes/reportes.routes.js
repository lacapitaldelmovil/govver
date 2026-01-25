/**
 * Rutas de Reportes - SQLite (Versión Limpia)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { query } = require('../database/connection');
const { authMiddleware, requireAdminSecretaria } = require('../middleware/auth');
const { generarReporteEjecutivo } = require('./reporteEjecutivo');

const router = express.Router();

/**
 * GET /api/reportes/estadisticas
 */
router.get('/estadisticas', authMiddleware, (req, res) => {
  try {
    const { rol, secretaria_id } = req.user;
    const esAdmin = rol === 'admin' || rol === 'gobernacion' || rol === 'admin_general';
    
    const filtroSecretaria = esAdmin ? '' : ` AND secretaria_id = ${secretaria_id}`;
    
    const totalVehiculos = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1${filtroSecretaria}`).rows[0]?.total || 0;
    const vehiculosOperando = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Operando'${filtroSecretaria}`).rows[0]?.total || 0;
    const vehiculosDisponibles = query(`SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Disponible'${filtroSecretaria}`).rows[0]?.total || 0;
    const solicitudesMes = query("SELECT COUNT(*) as total FROM solicitudes WHERE created_at >= date('now', '-30 days')").rows[0]?.total || 0;
    const totalSecretarias = esAdmin 
      ? query('SELECT COUNT(*) as total FROM secretarias WHERE activa = 1').rows[0]?.total || 0
      : 1;

    res.json({
      total_vehiculos: totalVehiculos,
      vehiculos_activos: vehiculosOperando + vehiculosDisponibles,
      vehiculos_operando: vehiculosOperando,
      vehiculos_disponibles: vehiculosDisponibles,
      solicitudes_mes: solicitudesMes,
      total_secretarias: totalSecretarias
    });
  } catch (error) {
    console.error('Error en estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

/**
 * GET /api/reportes/vehiculos - Exportar vehículos a CSV
 */
router.get('/vehiculos', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    const result = query(`
      SELECT v.*, s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
      FROM vehiculos v
      LEFT JOIN secretarias s ON v.secretaria_id = s.id
      ORDER BY v.id
    `);

    const headers = Object.keys(result.rows[0] || {}).join(',');
    const rows = result.rows.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=vehiculos.csv');
    res.send('\ufeff' + csv); // BOM para Excel
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

/**
 * GET /api/reportes/solicitudes - Exportar solicitudes a CSV
 */
router.get('/solicitudes', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (fecha_inicio && fecha_fin) {
      whereClause = 'WHERE sol.created_at BETWEEN ? AND ?';
      params = [fecha_inicio, fecha_fin];
    }

    const result = query(`
      SELECT sol.*, 
        v.marca, v.modelo, v.placas,
        ss.siglas as secretaria_solicitante,
        sp.siglas as secretaria_propietaria
      FROM solicitudes sol
      LEFT JOIN vehiculos v ON sol.vehiculo_id = v.id
      LEFT JOIN secretarias ss ON sol.secretaria_solicitante_id = ss.id
      LEFT JOIN secretarias sp ON sol.secretaria_propietaria_id = sp.id
      ${whereClause}
      ORDER BY sol.created_at DESC
    `, params);

    if (result.rows.length === 0) {
      return res.send('No hay solicitudes en el período seleccionado');
    }

    const headers = Object.keys(result.rows[0]).join(',');
    const rows = result.rows.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=solicitudes.csv');
    res.send('\ufeff' + csv);
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

/**
 * GET /api/reportes/eficiencia - Análisis de eficiencia por secretaría
 */
router.get('/eficiencia', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    const result = query(`
      SELECT 
        s.siglas,
        s.nombre,
        COUNT(v.id) as total,
        SUM(CASE WHEN v.estado_operativo = 'Operando' THEN 1 ELSE 0 END) as operando,
        SUM(CASE WHEN v.estado_operativo = 'Disponible' THEN 1 ELSE 0 END) as disponibles
      FROM secretarias s
      LEFT JOIN vehiculos v ON s.id = v.secretaria_id AND v.activo = 1
      WHERE s.activa = 1
      GROUP BY s.id, s.siglas, s.nombre
    `);

    const headers = 'siglas,nombre,total,operando,disponibles,eficiencia';
    const rows = result.rows.map(row => {
      const eficiencia = row.total > 0 ? ((row.operando / row.total) * 100).toFixed(1) : '0';
      return `${row.siglas},"${row.nombre}",${row.total || 0},${row.operando || 0},${row.disponibles || 0},${eficiencia}%`;
    });
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=eficiencia.csv');
    res.send('\ufeff' + csv);
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

/**
 * GET /api/reportes/costos - Análisis de costos
 */
router.get('/costos', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    const result = query(`
      SELECT 
        s.siglas,
        s.nombre,
        SUM(CASE WHEN v.regimen = 'Propio' THEN 1 ELSE 0 END) as propios,
        SUM(CASE WHEN v.regimen = 'Comodato' THEN 1 ELSE 0 END) as comodato,
        SUM(COALESCE(v.valor_libros, 0)) as valor_libros_total
      FROM secretarias s
      LEFT JOIN vehiculos v ON s.id = v.secretaria_id AND v.activo = 1
      WHERE s.activa = 1
      GROUP BY s.id, s.siglas, s.nombre
      ORDER BY valor_libros_total DESC
    `);

    const headers = 'siglas,nombre,propios,comodato,valor_libros_total';
    const rows = result.rows.map(row => {
      return `${row.siglas},"${row.nombre}",${row.propios || 0},${row.comodato || 0},${row.valor_libros_total || 0}`;
    });
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=analisis_costos.csv');
    res.send('\ufeff' + csv);
  } catch (error) {
    console.error('Error generando reporte de costos:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

/**
 * GET /api/reportes/ocupacion - Análisis de ocupación vehicular
 */
router.get('/ocupacion', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    const result = query(`
      SELECT 
        s.siglas,
        s.nombre,
        COUNT(v.id) as total_vehiculos,
        SUM(CASE WHEN v.estado_operativo = 'Operando' THEN 1 ELSE 0 END) as operando,
        SUM(CASE WHEN v.estado_operativo = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN v.estado_operativo = 'Mal estado' THEN 1 ELSE 0 END) as mal_estado,
        SUM(CASE WHEN v.estado_operativo = 'En taller' THEN 1 ELSE 0 END) as en_taller,
        SUM(CASE WHEN v.estado_operativo = 'Baja' THEN 1 ELSE 0 END) as baja
      FROM secretarias s
      LEFT JOIN vehiculos v ON s.id = v.secretaria_id AND v.activo = 1
      WHERE s.activa = 1
      GROUP BY s.id, s.siglas, s.nombre
      ORDER BY total_vehiculos DESC
    `);

    const headers = 'siglas,nombre,total_vehiculos,operando,disponibles,mal_estado,en_taller,baja,tasa_utilizacion';
    const rows = result.rows.map(row => {
      const tasaUtilizacion = row.total_vehiculos > 0 
        ? ((row.operando / row.total_vehiculos) * 100).toFixed(1) 
        : '0';
      return `${row.siglas},"${row.nombre}",${row.total_vehiculos || 0},${row.operando || 0},${row.disponibles || 0},${row.mal_estado || 0},${row.en_taller || 0},${row.baja || 0},${tasaUtilizacion}%`;
    });
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=ocupacion_vehicular.csv');
    res.send('\ufeff' + csv);
  } catch (error) {
    console.error('Error generando reporte de ocupación:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

/**
 * GET /api/reportes/ejecutivo - Reporte Ejecutivo HTML
 */
router.get('/ejecutivo', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    console.log('[REPORTE] Generando Reporte Ejecutivo...');
    
    const html = generarReporteEjecutivo(req);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Ejecutivo_Flota_DIF_${new Date().toISOString().split('T')[0]}.html`);
    
    console.log('[OK] Reporte Ejecutivo generado');
    res.send(html);
    
  } catch (error) {
    console.error('[ERROR] Error generando reporte ejecutivo:', error);
    res.status(500).json({ error: 'Error al generar reporte ejecutivo', details: error.message });
  }
});

/**
 * GET /api/reportes/ejecutivo/datos - Datos JSON para reporte
 */
router.get('/ejecutivo/datos', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    const datos = {
      generado: new Date().toISOString(),
      
      resumen: {
        total_vehiculos: query('SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1').rows[0]?.total || 0,
        vehiculos_operando: query("SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Operando'").rows[0]?.total || 0,
        vehiculos_disponibles: query("SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Disponible'").rows[0]?.total || 0,
        vehiculos_mal_estado: query("SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Mal estado'").rows[0]?.total || 0,
        vehiculos_baja: query("SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND estado_operativo = 'Baja'").rows[0]?.total || 0,
        propuestos_baja: query("SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND propuesto_baja = 1").rows[0]?.total || 0,
      },
      
      regimen: {
        propios: query("SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND regimen = 'Propio'").rows[0]?.total || 0,
        comodato: query("SELECT COUNT(*) as total FROM vehiculos WHERE activo = 1 AND regimen = 'Comodato'").rows[0]?.total || 0,
      },
      
      valor_flota: query('SELECT SUM(valor_libros) as total FROM vehiculos WHERE activo = 1 AND valor_libros > 0').rows[0]?.total || 0
    };

    res.json(datos);
  } catch (error) {
    console.error('Error obteniendo datos ejecutivo:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

module.exports = router;
