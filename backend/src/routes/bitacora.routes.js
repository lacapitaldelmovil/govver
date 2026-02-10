/**
 * Rutas de Bitácora Vehicular - SQLite
 * Incluye: cargas de combustible, incidencias y timeline unificada
 */

const express = require('express');
const { query } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ==================== TIMELINE UNIFICADA ====================

/**
 * GET /api/bitacora/:vehiculoId
 * Timeline cronológica de TODO lo que le ha pasado a un vehículo
 */
router.get('/:vehiculoId', authMiddleware, (req, res) => {
  try {
    const { vehiculoId } = req.params;
    const { desde, hasta, tipo, limit = 100 } = req.query;

    // Verificar que el vehículo existe
    const veh = query('SELECT id, marca, linea, placas FROM vehiculos WHERE id = ?', [vehiculoId]);
    if (!veh.rows.length) return res.status(404).json({ error: 'Vehículo no encontrado' });

    let eventos = [];

    // 1. Asignaciones (salidas/entradas)
    if (!tipo || tipo === 'asignacion' || tipo === 'todos') {
      try {
        const asg = query(`
          SELECT id, 'asignacion' as categoria,
            estado as sub_tipo,
            COALESCE(fecha_salida, created_at) as fecha,
            hora_salida as hora,
            conductor_nombre,
            conductor_cargo,
            estado as estado_evento,
            folio,
            km_salida, km_entrada, destino, motivo,
            combustible_salida, combustible_entrada,
            fecha_salida, hora_salida, fecha_entrada, hora_entrada,
            estado_devolucion, observaciones_entrada,
            created_at
          FROM asignaciones
          WHERE vehiculo_id = ?
          ORDER BY created_at DESC
        `, [vehiculoId]);
        eventos.push(...asg.rows.map(e => ({
          ...e,
          categoria: 'asignacion',
          icono: '🚗',
          color: e.estado_evento === 'en_uso' ? 'amber' : e.estado_evento === 'devuelto' ? 'green' : 'gray'
        })));
      } catch {}
    }

    // 2. Mantenimientos
    if (!tipo || tipo === 'mantenimiento' || tipo === 'todos') {
      try {
        const mant = query(`
          SELECT id, 'mantenimiento' as categoria, tipo as sub_tipo,
            COALESCE(fecha_entrada, created_at) as fecha,
            NULL as hora,
            tipo as tipo_mantenimiento,
            descripcion,
            estado as estado_evento,
            proveedor, costo,
            km_entrada, km_salida,
            created_at
          FROM mantenimientos
          WHERE vehiculo_id = ?
          ORDER BY created_at DESC
        `, [vehiculoId]);
        eventos.push(...mant.rows.map(e => ({
          ...e,
          categoria: 'mantenimiento',
          icono: '🔧',
          color: e.estado_evento === 'completado' ? 'green' : e.estado_evento === 'en_proceso' ? 'yellow' : 'blue'
        })));
      } catch {}
    }

    // 3. Cargas de combustible
    if (!tipo || tipo === 'combustible' || tipo === 'todos') {
      try {
        const comb = query(`
          SELECT id, 'combustible' as categoria, tipo_combustible as sub_tipo,
            fecha, hora,
            conductor_nombre,
            litros, costo_total, precio_litro, tipo_combustible,
            km_actual, rendimiento_km_litro,
            estacion, cfdi,
            created_at
          FROM cargas_combustible
          WHERE vehiculo_id = ?
          ORDER BY fecha DESC
        `, [vehiculoId]);
        eventos.push(...comb.rows.map(e => ({
          ...e,
          categoria: 'combustible',
          icono: '⛽',
          color: 'blue'
        })));
      } catch {}
    }

    // 4. Incidencias
    if (!tipo || tipo === 'incidencia' || tipo === 'todos') {
      try {
        const inc = query(`
          SELECT id, 'incidencia' as categoria, tipo as sub_tipo,
            fecha, hora,
            tipo as tipo_incidencia,
            gravedad,
            descripcion,
            estado as estado_evento,
            folio,
            ubicacion, conductor_nombre,
            costo_estimado_danos,
            fecha_resolucion, resolucion,
            created_at
          FROM incidencias
          WHERE vehiculo_id = ?
          ORDER BY fecha DESC
        `, [vehiculoId]);
        eventos.push(...inc.rows.map(e => ({
          ...e,
          categoria: 'incidencia',
          icono: '⚠️',
          color: e.estado_evento === 'resuelto' ? 'green' : e.gravedad === 'grave' || e.gravedad === 'perdida_total' ? 'red' : 'orange'
        })));
      } catch {}
    }

    // 5. Movimientos generales
    // When showing "todos", skip salida/entrada movimientos (they duplicate asignaciones info)
    if (!tipo || tipo === 'movimiento' || tipo === 'todos') {
      try {
        const excludeSalidaEntrada = (!tipo || tipo === 'todos');
        const mov = query(`
          SELECT m.id, 'movimiento' as categoria, m.tipo_movimiento as sub_tipo,
            m.created_at as fecha,
            NULL as hora,
            m.tipo_movimiento,
            m.descripcion,
            u.nombre as usuario_nombre,
            m.created_at
          FROM movimientos m
          LEFT JOIN usuarios u ON m.usuario_id = u.id
          WHERE m.vehiculo_id = ?
          ${excludeSalidaEntrada ? "AND m.tipo_movimiento NOT IN ('salida','entrada')" : ""}
          ORDER BY m.created_at DESC
        `, [vehiculoId]);
        eventos.push(...mov.rows.map(e => ({
          ...e,
          categoria: 'movimiento',
          icono: '📋',
          color: e.tipo_movimiento === 'salida' ? 'amber' : e.tipo_movimiento === 'entrada' ? 'green' : 'gray'
        })));
      } catch {}
    }

    // Filtrar por fecha
    if (desde) eventos = eventos.filter(e => (e.fecha || e.created_at) >= desde);
    if (hasta) eventos = eventos.filter(e => (e.fecha || e.created_at) <= hasta);

    // Ordenar TODO por fecha descendente
    eventos.sort((a, b) => {
      const fa = (b.fecha || b.created_at || '');
      const fb = (a.fecha || a.created_at || '');
      return fa.localeCompare(fb);
    });

    // Limitar
    eventos = eventos.slice(0, parseInt(limit));

    // Stats — for movimiento count, show ALL movimientos (even those hidden in 'todos' view)
    let totalMovimientos = eventos.filter(e => e.categoria === 'movimiento').length;
    if (!tipo || tipo === 'todos') {
      try {
        const allMov = query('SELECT COUNT(*) as cnt FROM movimientos WHERE vehiculo_id = ?', [vehiculoId]);
        totalMovimientos = allMov.rows[0]?.cnt || 0;
      } catch {}
    }

    const stats = {
      total_eventos: eventos.length,
      asignaciones: eventos.filter(e => e.categoria === 'asignacion').length,
      mantenimientos: eventos.filter(e => e.categoria === 'mantenimiento').length,
      combustible: eventos.filter(e => e.categoria === 'combustible').length,
      incidencias: eventos.filter(e => e.categoria === 'incidencia').length,
      movimientos: totalMovimientos
    };

    res.json({ vehiculo: veh.rows[0], eventos, stats });
  } catch (error) {
    console.error('Error obteniendo bitácora:', error);
    res.status(500).json({ error: 'Error al obtener bitácora' });
  }
});


// ==================== CARGAS DE COMBUSTIBLE ====================

/**
 * GET /api/bitacora/combustible/:vehiculoId
 */
router.get('/combustible/:vehiculoId', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT c.*, u.nombre as registrado_por
      FROM cargas_combustible c
      LEFT JOIN usuarios u ON c.usuario_registro_id = u.id
      WHERE c.vehiculo_id = ?
      ORDER BY c.fecha DESC, c.hora DESC
      LIMIT 100
    `, [req.params.vehiculoId]);

    // Calcular rendimiento acumulado
    const cargas = result.rows;
    let totalLitros = 0, totalCosto = 0;
    cargas.forEach(c => { totalLitros += c.litros || 0; totalCosto += c.costo_total || 0; });

    res.json({
      cargas,
      resumen: {
        total_cargas: cargas.length,
        total_litros: Math.round(totalLitros * 100) / 100,
        total_costo: Math.round(totalCosto * 100) / 100,
        promedio_litros: cargas.length ? Math.round((totalLitros / cargas.length) * 100) / 100 : 0,
        promedio_costo: cargas.length ? Math.round((totalCosto / cargas.length) * 100) / 100 : 0
      }
    });
  } catch (error) {
    console.error('Error listando cargas:', error);
    res.status(500).json({ error: 'Error al obtener cargas de combustible' });
  }
});

/**
 * POST /api/bitacora/combustible
 */
router.post('/combustible', authMiddleware, (req, res) => {
  try {
    const { vehiculo_id, fecha, hora, litros, costo_total, precio_litro, tipo_combustible,
            km_actual, estacion, numero_bomba, conductor_nombre, cfdi, metodo_pago, observaciones } = req.body;

    if (!vehiculo_id || !fecha || !litros) {
      return res.status(400).json({ error: 'vehiculo_id, fecha y litros son obligatorios' });
    }

    // Calcular rendimiento si hay km y carga anterior
    let rendimiento = null;
    if (km_actual) {
      const anterior = query(`
        SELECT km_actual, litros FROM cargas_combustible 
        WHERE vehiculo_id = ? AND km_actual IS NOT NULL AND km_actual < ?
        ORDER BY fecha DESC, hora DESC LIMIT 1
      `, [vehiculo_id, km_actual]);
      if (anterior.rows.length) {
        const kmRecorridos = km_actual - anterior.rows[0].km_actual;
        if (kmRecorridos > 0 && litros > 0) {
          rendimiento = Math.round((kmRecorridos / litros) * 100) / 100;
        }
      }
    }

    const precioCalc = precio_litro || (costo_total && litros ? Math.round((costo_total / litros) * 100) / 100 : null);

    const result = query(`
      INSERT INTO cargas_combustible (vehiculo_id, fecha, hora, litros, costo_total, precio_litro, tipo_combustible,
        km_actual, rendimiento_km_litro, estacion, numero_bomba, conductor_nombre, cfdi, metodo_pago, observaciones, usuario_registro_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [vehiculo_id, fecha, hora || null, litros, costo_total || null, precioCalc, tipo_combustible || 'gasolina_regular',
        km_actual || null, rendimiento, estacion || null, numero_bomba || null, conductor_nombre || null, cfdi || null, metodo_pago || null, observaciones || null, req.user.id]);

    // Actualizar km del vehículo si se proporcionó
    if (km_actual) {
      query('UPDATE vehiculos SET kilometraje = MAX(COALESCE(kilometraje,0), ?) WHERE id = ?', [km_actual, vehiculo_id]);
    }

    res.status(201).json({
      message: 'Carga de combustible registrada',
      id: result.lastInsertRowid,
      rendimiento_km_litro: rendimiento
    });
  } catch (error) {
    console.error('Error registrando carga:', error);
    res.status(500).json({ error: 'Error al registrar carga de combustible' });
  }
});

/**
 * DELETE /api/bitacora/combustible/:id
 */
router.delete('/combustible/:id', authMiddleware, (req, res) => {
  try {
    const existing = query('SELECT id FROM cargas_combustible WHERE id = ?', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Carga no encontrada' });
    query('DELETE FROM cargas_combustible WHERE id = ?', [req.params.id]);
    res.json({ message: 'Carga eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar carga' });
  }
});


// ==================== INCIDENCIAS ====================

/**
 * GET /api/bitacora/incidencias/:vehiculoId
 */
router.get('/incidencias/:vehiculoId', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT i.*, u.nombre as registrado_por
      FROM incidencias i
      LEFT JOIN usuarios u ON i.usuario_registro_id = u.id
      WHERE i.vehiculo_id = ?
      ORDER BY i.fecha DESC
      LIMIT 50
    `, [req.params.vehiculoId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error listando incidencias:', error);
    res.status(500).json({ error: 'Error al obtener incidencias' });
  }
});

/**
 * POST /api/bitacora/incidencias
 */
router.post('/incidencias', authMiddleware, (req, res) => {
  try {
    const { vehiculo_id, fecha, hora, tipo, gravedad, descripcion, ubicacion,
            conductor_nombre, conductor_licencia, terceros_involucrados,
            numero_siniestro_aseguradora, folio_ministerio_publico,
            costo_estimado_danos, fotos, observaciones } = req.body;

    if (!vehiculo_id || !fecha || !tipo || !descripcion) {
      return res.status(400).json({ error: 'vehiculo_id, fecha, tipo y descripción son obligatorios' });
    }

    // Generar folio INC-YYMM-XXXXXX
    const now = new Date();
    const yymm = String(now.getFullYear()).slice(-2) + String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const folio = `INC-${yymm}-${rand}`;

    const result = query(`
      INSERT INTO incidencias (folio, vehiculo_id, fecha, hora, tipo, gravedad, descripcion, ubicacion,
        conductor_nombre, conductor_licencia, terceros_involucrados,
        numero_siniestro_aseguradora, folio_ministerio_publico,
        costo_estimado_danos, fotos, observaciones, usuario_registro_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [folio, vehiculo_id, fecha, hora || null, tipo, gravedad || 'leve', descripcion, ubicacion || null,
        conductor_nombre || null, conductor_licencia || null, terceros_involucrados || null,
        numero_siniestro_aseguradora || null, folio_ministerio_publico || null,
        costo_estimado_danos || null, fotos || null, observaciones || null, req.user.id]);

    res.status(201).json({ message: 'Incidencia registrada', id: result.lastInsertRowid, folio });
  } catch (error) {
    console.error('Error registrando incidencia:', error);
    res.status(500).json({ error: 'Error al registrar incidencia' });
  }
});

/**
 * PUT /api/bitacora/incidencias/:id
 * Actualizar estado de incidencia
 */
router.put('/incidencias/:id', authMiddleware, (req, res) => {
  try {
    const { estado, resolucion, observaciones, numero_siniestro_aseguradora, costo_estimado_danos } = req.body;
    const existing = query('SELECT id FROM incidencias WHERE id = ?', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Incidencia no encontrada' });

    const sets = [];
    const params = [];
    if (estado) { sets.push('estado = ?'); params.push(estado); }
    if (resolucion !== undefined) { sets.push('resolucion = ?'); params.push(resolucion); }
    if (observaciones !== undefined) { sets.push('observaciones = ?'); params.push(observaciones); }
    if (numero_siniestro_aseguradora !== undefined) { sets.push('numero_siniestro_aseguradora = ?'); params.push(numero_siniestro_aseguradora); }
    if (costo_estimado_danos !== undefined) { sets.push('costo_estimado_danos = ?'); params.push(costo_estimado_danos); }
    if (estado === 'resuelto' || estado === 'cerrado') { sets.push("fecha_resolucion = date('now')"); }
    sets.push("updated_at = datetime('now')");

    query(`UPDATE incidencias SET ${sets.join(', ')} WHERE id = ?`, [...params, req.params.id]);
    res.json({ message: 'Incidencia actualizada' });
  } catch (error) {
    console.error('Error actualizando incidencia:', error);
    res.status(500).json({ error: 'Error al actualizar incidencia' });
  }
});

module.exports = router;
