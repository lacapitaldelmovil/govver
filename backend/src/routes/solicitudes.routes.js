/**
 * Rutas de Solicitudes - SQLite
 */

const express = require('express');
const { query } = require('../database/connection');
const { authMiddleware, requireGobernacion } = require('../middleware/auth');

const router = express.Router();

// Generar folio único
function generarFolio() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SOL-${año}${mes}-${random}`;
}

/**
 * GET /api/solicitudes - Listar solicitudes
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const { estado, tipo, page = 1, limit = 20 } = req.query;
    
    let sql = `
      SELECT sol.*,
        v.marca, v.modelo, v.placas, v.tipo as vehiculo_tipo, v.anio as vehiculo_anio,
        v.color as vehiculo_color, v.numero_economico as vehiculo_numero_economico,
        so.nombre as secretaria_origen_nombre, so.siglas as secretaria_origen_siglas,
        sd.nombre as secretaria_destino_nombre, sd.siglas as secretaria_destino_siglas,
        u.nombre as usuario_nombre, u.email as usuario_email,
        us_sec.siglas as secretaria_solicitante_siglas
      FROM solicitudes sol
      LEFT JOIN vehiculos v ON sol.vehiculo_id = v.id
      LEFT JOIN secretarias so ON sol.secretaria_origen_id = so.id
      LEFT JOIN secretarias sd ON sol.secretaria_destino_id = sd.id
      LEFT JOIN usuarios u ON sol.usuario_solicitante_id = u.id
      LEFT JOIN secretarias us_sec ON u.secretaria_id = us_sec.id
      WHERE 1=1
    `;
    const params = [];
    
    if (estado) {
      sql += ' AND sol.estado = ?';
      params.push(estado);
    }
    if (tipo) {
      sql += ' AND sol.tipo = ?';
      params.push(tipo);
    }
    
    sql += ' ORDER BY sol.created_at DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const result = query(sql, params);
    
    // Contar total
    let countSql = 'SELECT COUNT(*) as total FROM solicitudes sol WHERE 1=1';
    const countParams = [];
    if (estado) {
      countSql += ' AND sol.estado = ?';
      countParams.push(estado);
    }
    if (tipo) {
      countSql += ' AND sol.tipo = ?';
      countParams.push(tipo);
    }
    const countResult = query(countSql, countParams);
    
    res.json({
      data: result.rows,
      total: countResult.rows[0]?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error listando solicitudes:', error);
    res.status(500).json({ error: 'Error al listar solicitudes' });
  }
});

/**
 * GET /api/solicitudes/:id - Obtener solicitud
 */
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT sol.*,
        v.marca, v.modelo, v.placas, v.numero_inventario,
        so.nombre as secretaria_origen_nombre,
        sd.nombre as secretaria_destino_nombre,
        u.nombre as usuario_nombre
      FROM solicitudes sol
      LEFT JOIN vehiculos v ON sol.vehiculo_id = v.id
      LEFT JOIN secretarias so ON sol.secretaria_origen_id = so.id
      LEFT JOIN secretarias sd ON sol.secretaria_destino_id = sd.id
      LEFT JOIN usuarios u ON sol.usuario_solicitante_id = u.id
      WHERE sol.id = ?
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    res.status(500).json({ error: 'Error al obtener solicitud' });
  }
});

/**
 * POST /api/solicitudes - Crear solicitud
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const {
      // Formato inter-secretaría (nuevo)
      vehiculo_id, secretaria_destino_id,
      // Formato anterior (tipo genérico)
      tipo_vehiculo, cantidad_vehiculos, destino,
      // Campos comunes
      tipo, secretaria_origen_id,
      fecha_inicio, fecha_fin, motivo, justificacion, observaciones_solicitante, prioridad
    } = req.body;
    
    const folio = generarFolio();
    
    // El tipo siempre debe ser uno de los permitidos: prestamo, transferencia, devolucion, baja, mantenimiento
    const tipoFinal = tipo || 'prestamo';
    
    // Construir justificación
    let justificacionFinal = justificacion || '';
    if (!justificacionFinal && tipo_vehiculo) {
      // Formato anterior sin vehículo específico
      justificacionFinal = `Vehículo requerido: ${tipo_vehiculo.toUpperCase()}`;
      if (cantidad_vehiculos && cantidad_vehiculos > 1) {
        justificacionFinal += ` (${cantidad_vehiculos} unidades)`;
      }
      if (destino) {
        justificacionFinal += ` | Destino: ${destino}`;
      }
      if (observaciones_solicitante) {
        justificacionFinal += ` | Obs: ${observaciones_solicitante}`;
      }
    }
    
    // Si viene destino y no hay justificación, agregarla
    if (destino && !justificacionFinal.includes('Destino:')) {
      justificacionFinal += (justificacionFinal ? ' | ' : '') + `Destino: ${destino}`;
    }
    if (observaciones_solicitante && !justificacionFinal.includes('Obs:')) {
      justificacionFinal += (justificacionFinal ? ' | ' : '') + `Obs: ${observaciones_solicitante}`;
    }
    
    // Determinar secretaria_destino: si viene vehiculo_id, obtener la secretaría dueña del vehículo
    let secretariaDestinoFinal = secretaria_destino_id || null;
    if (vehiculo_id && !secretariaDestinoFinal) {
      const vehiculoCheck = query('SELECT secretaria_id FROM vehiculos WHERE id = ?', [vehiculo_id]);
      if (vehiculoCheck.rows.length > 0) {
        secretariaDestinoFinal = vehiculoCheck.rows[0].secretaria_id;
      }
    }
    
    const result = query(`
      INSERT INTO solicitudes (
        folio, tipo, vehiculo_id, secretaria_origen_id, secretaria_destino_id,
        usuario_solicitante_id, fecha_inicio, fecha_fin, motivo, justificacion, prioridad
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      folio, 
      tipoFinal, 
      vehiculo_id || null, 
      secretaria_origen_id || req.user.secretaria_id || null, 
      secretariaDestinoFinal,
      req.user.id, 
      fecha_inicio || null, 
      fecha_fin || null, 
      motivo, 
      justificacionFinal || null, 
      prioridad || 'normal'
    ]);
    
    res.status(201).json({ 
      message: 'Solicitud creada exitosamente',
      folio,
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ error: 'Error al crear solicitud' });
  }
});

/**
 * PUT /api/solicitudes/:id/aprobar - Aprobar solicitud y asignar vehículo
 */
router.put('/:id/aprobar', authMiddleware, requireGobernacion, (req, res) => {
  try {
    const { vehiculo_id, observaciones } = req.body;
    
    // Verificar que se proporcionó un vehículo
    if (!vehiculo_id) {
      return res.status(400).json({ error: 'Debe seleccionar un vehículo para asignar' });
    }
    
    // Obtener info del vehículo para la notificación
    const vehiculoResult = query(`
      SELECT v.*, s.siglas as secretaria_siglas, s.nombre as secretaria_nombre 
      FROM vehiculos v 
      LEFT JOIN secretarias s ON v.secretaria_id = s.id 
      WHERE v.id = ?
    `, [vehiculo_id]);
    
    if (!vehiculoResult.rows.length) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    
    const vehiculo = vehiculoResult.rows[0];
    
    // Actualizar la solicitud con el vehículo asignado
    query(`
      UPDATE solicitudes SET 
        estado = 'aprobada',
        vehiculo_id = ?,
        secretaria_destino_id = ?,
        usuario_autorizador_id = ?,
        fecha_autorizacion = datetime('now'),
        observaciones = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [vehiculo_id, vehiculo.secretaria_id, req.user.id, observaciones || `Vehículo asignado: ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas}) de ${vehiculo.secretaria_siglas}`, req.params.id]);
    
    // Actualizar estado del vehículo a "En préstamo" o similar
    query(`
      UPDATE vehiculos SET 
        estado_operativo = 'Operando',
        updated_at = datetime('now')
      WHERE id = ?
    `, [vehiculo_id]);
    
    res.json({ 
      message: 'Solicitud aprobada exitosamente',
      vehiculo: {
        id: vehiculo.id,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        placas: vehiculo.placas,
        secretaria: vehiculo.secretaria_siglas
      }
    });
  } catch (error) {
    console.error('Error aprobando solicitud:', error);
    res.status(500).json({ error: 'Error al aprobar solicitud' });
  }
});

/**
 * PUT /api/solicitudes/:id/rechazar - Rechazar solicitud
 */
router.put('/:id/rechazar', authMiddleware, requireGobernacion, (req, res) => {
  try {
    const { observaciones } = req.body;
    
    query(`
      UPDATE solicitudes SET 
        estado = 'rechazada',
        usuario_autorizador_id = ?,
        fecha_autorizacion = datetime('now'),
        observaciones = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [req.user.id, observaciones || null, req.params.id]);
    
    res.json({ message: 'Solicitud rechazada' });
  } catch (error) {
    console.error('Error rechazando solicitud:', error);
    res.status(500).json({ error: 'Error al rechazar solicitud' });
  }
});

/**
 * PUT /api/solicitudes/:id/cancelar - Cancelar solicitud (por el solicitante)
 */
router.put('/:id/cancelar', authMiddleware, (req, res) => {
  try {
    const sol = query('SELECT * FROM solicitudes WHERE id = ?', [req.params.id]);
    if (!sol.rows.length) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (sol.rows[0].estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden cancelar solicitudes pendientes' });
    }
    query(`UPDATE solicitudes SET estado = 'cancelada', updated_at = datetime('now') WHERE id = ?`,
      [req.params.id]);
    res.json({ message: 'Solicitud cancelada' });
  } catch (error) {
    console.error('Error cancelando solicitud:', error);
    res.status(500).json({ error: 'Error al cancelar solicitud' });
  }
});

/**
 * PUT /api/solicitudes/:id/completar - Marcar préstamo como completado (vehículo devuelto)
 */
router.put('/:id/completar', authMiddleware, (req, res) => {
  try {
    const sol = query(`
      SELECT sol.*, v.secretaria_id as vehiculo_secretaria_id, v.id as vid
      FROM solicitudes sol
      LEFT JOIN vehiculos v ON sol.vehiculo_id = v.id
      WHERE sol.id = ?
    `, [req.params.id]);
    if (!sol.rows.length) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const s = sol.rows[0];
    if (s.estado !== 'aprobada') {
      return res.status(400).json({ error: 'Solo se pueden completar solicitudes aprobadas' });
    }

    // Marcar solicitud como completada
    query(`UPDATE solicitudes SET estado = 'completada', updated_at = datetime('now') WHERE id = ?`,
      [req.params.id]);

    // Si hay vehículo asignado, restablecer su régimen a Propio
    if (s.vehiculo_id) {
      query(`UPDATE vehiculos SET regimen = 'Propio', estado_operativo = 'Operando', updated_at = datetime('now') WHERE id = ?`,
        [s.vehiculo_id]);
    }

    res.json({ message: 'Préstamo completado, vehículo devuelto' });
  } catch (error) {
    console.error('Error completando solicitud:', error);
    res.status(500).json({ error: 'Error al completar solicitud' });
  }
});

/**
 * DELETE /api/solicitudes/:id - Cancelar solicitud (legacy)
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    query(`UPDATE solicitudes SET estado = 'cancelada', updated_at = datetime('now') WHERE id = ?`, 
      [req.params.id]);
    res.json({ message: 'Solicitud cancelada' });
  } catch (error) {
    console.error('Error cancelando solicitud:', error);
    res.status(500).json({ error: 'Error al cancelar solicitud' });
  }
});

module.exports = router;
