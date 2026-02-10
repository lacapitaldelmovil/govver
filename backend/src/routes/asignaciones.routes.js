/**
 * Rutas de Asignaciones - Control de Salida/Entrada de Vehículos
 * Registrar a quién se asigna un vehículo, cuándo sale y cuándo regresa
 */

const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');

// Generar folio único para asignación
function generarFolio() {
  const fecha = new Date();
  const yy = fecha.getFullYear().toString().slice(-2);
  const mm = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ASG-${yy}${mm}-${rand}`;
}

/**
 * GET /api/asignaciones - Listar asignaciones con filtros
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const { estado, vehiculo_id, secretaria_id, busqueda, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const user = req.user;

    let sql = `
      SELECT a.*,
        v.marca, v.linea, v.modelo, v.anio, v.placas, v.numero_economico, v.color, v.tipo,
        s.nombre as secretaria_nombre, s.siglas as secretaria_siglas,
        ur.nombre as registrado_por_nombre,
        ud.nombre as devuelto_por_nombre
      FROM asignaciones a
      INNER JOIN vehiculos v ON a.vehiculo_id = v.id
      LEFT JOIN secretarias s ON a.secretaria_id = s.id
      LEFT JOIN usuarios ur ON a.usuario_registro_id = ur.id
      LEFT JOIN usuarios ud ON a.usuario_devolucion_id = ud.id
      WHERE 1=1
    `;
    const params = [];

    // Filtrar por secretaría del usuario si no es admin/gobernación
    if (!['admin', 'gobernacion'].includes(user.rol)) {
      sql += ' AND a.secretaria_id = ?';
      params.push(user.secretaria_id);
    }

    if (estado) {
      sql += ' AND a.estado = ?';
      params.push(estado);
    }
    if (vehiculo_id) {
      sql += ' AND a.vehiculo_id = ?';
      params.push(vehiculo_id);
    }
    if (secretaria_id && ['admin', 'gobernacion'].includes(user.rol)) {
      sql += ' AND a.secretaria_id = ?';
      params.push(secretaria_id);
    }
    if (busqueda) {
      sql += ` AND (
        a.conductor_nombre LIKE ? OR a.folio LIKE ? OR a.destino LIKE ? OR
        v.placas LIKE ? OR v.marca LIKE ? OR v.linea LIKE ?
      )`;
      const term = `%${busqueda}%`;
      params.push(term, term, term, term, term, term);
    }

    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = query(sql, params);

    // Contar total
    let countSql = `SELECT COUNT(*) as total FROM asignaciones a WHERE 1=1`;
    const countParams = [];
    if (!['admin', 'gobernacion'].includes(user.rol)) {
      countSql += ' AND a.secretaria_id = ?';
      countParams.push(user.secretaria_id);
    }
    if (estado) {
      countSql += ' AND a.estado = ?';
      countParams.push(estado);
    }
    const countResult = query(countSql, countParams);

    // Stats rápidas
    let statsBase = `FROM asignaciones a WHERE 1=1`;
    const statsParams = [];
    if (!['admin', 'gobernacion'].includes(user.rol)) {
      statsBase += ' AND a.secretaria_id = ?';
      statsParams.push(user.secretaria_id);
    }
    const enUso = query(`SELECT COUNT(*) as c ${statsBase} AND a.estado = 'en_uso'`, statsParams);
    const devueltos = query(`SELECT COUNT(*) as c ${statsBase} AND a.estado = 'devuelto'`, statsParams);

    res.json({
      asignaciones: result.rows,
      total: countResult.rows[0]?.total || 0,
      stats: {
        en_uso: enUso.rows[0]?.c || 0,
        devueltos: devueltos.rows[0]?.c || 0
      },
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error listando asignaciones:', error);
    res.status(500).json({ error: 'Error al listar asignaciones' });
  }
});

/**
 * GET /api/asignaciones/activas - Solo las que están en uso (para vista rápida)
 */
router.get('/activas', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    let sql = `
      SELECT a.*,
        v.marca, v.linea, v.modelo, v.anio, v.placas, v.numero_economico, v.color, v.tipo,
        s.siglas as secretaria_siglas
      FROM asignaciones a
      INNER JOIN vehiculos v ON a.vehiculo_id = v.id
      LEFT JOIN secretarias s ON a.secretaria_id = s.id
      WHERE a.estado = 'en_uso'
    `;
    const params = [];

    if (!['admin', 'gobernacion'].includes(user.rol)) {
      sql += ' AND a.secretaria_id = ?';
      params.push(user.secretaria_id);
    }
    sql += ' ORDER BY a.fecha_salida DESC';

    const result = query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener asignaciones activas' });
  }
});

/**
 * GET /api/asignaciones/:id - Detalle de una asignación
 */
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT a.*,
        v.marca, v.linea, v.modelo, v.anio, v.placas, v.numero_economico, v.color, v.tipo,
        v.kilometraje as km_actual_vehiculo,
        s.nombre as secretaria_nombre, s.siglas as secretaria_siglas,
        ur.nombre as registrado_por_nombre,
        ud.nombre as devuelto_por_nombre
      FROM asignaciones a
      INNER JOIN vehiculos v ON a.vehiculo_id = v.id
      LEFT JOIN secretarias s ON a.secretaria_id = s.id
      LEFT JOIN usuarios ur ON a.usuario_registro_id = ur.id
      LEFT JOIN usuarios ud ON a.usuario_devolucion_id = ud.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener asignación' });
  }
});

/**
 * POST /api/asignaciones - Registrar salida (asignar vehículo a persona)
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const {
      vehiculo_id,
      conductor_nombre,
      conductor_cargo,
      conductor_telefono,
      conductor_email,
      conductor_licencia,
      fecha_salida,
      hora_salida,
      km_salida,
      combustible_salida,
      destino,
      motivo,
      observaciones_salida
    } = req.body;

    if (!vehiculo_id || !conductor_nombre || !fecha_salida || !motivo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: vehículo, conductor, fecha de salida y motivo' });
    }

    // Verificar que el vehículo existe y está activo
    const veh = query('SELECT id, secretaria_id, placas, marca, linea FROM vehiculos WHERE id = ? AND activo = 1', [vehiculo_id]);
    if (veh.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado o no está activo' });
    }

    // Verificar que no tiene ya una asignación activa
    const activa = query("SELECT id FROM asignaciones WHERE vehiculo_id = ? AND estado = 'en_uso'", [vehiculo_id]);
    if (activa.rows.length > 0) {
      return res.status(400).json({ error: 'Este vehículo ya tiene una asignación activa. Debe registrar la entrada primero.' });
    }

    const folio = generarFolio();
    const secretariaId = veh.rows[0].secretaria_id || req.user.secretaria_id;

    query(`
      INSERT INTO asignaciones (
        folio, vehiculo_id, secretaria_id,
        conductor_nombre, conductor_cargo, conductor_telefono, conductor_email, conductor_licencia,
        fecha_salida, hora_salida, km_salida, combustible_salida,
        destino, motivo, observaciones_salida,
        estado, usuario_registro_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_uso', ?)
    `, [
      folio, vehiculo_id, secretariaId,
      conductor_nombre, conductor_cargo || null, conductor_telefono || null,
      conductor_email || null, conductor_licencia || null,
      fecha_salida, hora_salida || null, km_salida || null, combustible_salida || null,
      destino || null, motivo, observaciones_salida || null,
      req.user.id
    ]);

    // Registrar movimiento de salida
    query(`
      INSERT INTO movimientos (vehiculo_id, tipo_movimiento, secretaria_origen_id, usuario_id, descripcion)
      VALUES (?, 'salida', ?, ?, ?)
    `, [vehiculo_id, secretariaId, req.user.id, `Asignado a ${conductor_nombre} — ${motivo}`]);

    // Actualizar km del vehículo si se proporcionó
    if (km_salida) {
      query('UPDATE vehiculos SET kilometraje = ?, updated_at = datetime("now") WHERE id = ?', [km_salida, vehiculo_id]);
    }

    res.status(201).json({
      message: 'Salida registrada exitosamente',
      folio,
      vehiculo: `${veh.rows[0].marca} ${veh.rows[0].linea} (${veh.rows[0].placas})`
    });
  } catch (error) {
    console.error('Error registrando salida:', error);
    res.status(500).json({ error: 'Error al registrar la salida' });
  }
});

/**
 * PUT /api/asignaciones/:id/devolver - Registrar entrada (devolución del vehículo)
 */
router.put('/:id/devolver', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha_entrada,
      hora_entrada,
      km_entrada,
      combustible_entrada,
      estado_devolucion,
      observaciones_entrada
    } = req.body;

    if (!fecha_entrada) {
      return res.status(400).json({ error: 'La fecha de entrada es obligatoria' });
    }

    // Verificar que existe y está en uso
    const asg = query("SELECT * FROM asignaciones WHERE id = ? AND estado = 'en_uso'", [id]);
    if (asg.rows.length === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada o ya fue devuelta' });
    }

    const asignacion = asg.rows[0];

    query(`
      UPDATE asignaciones SET
        fecha_entrada = ?,
        hora_entrada = ?,
        km_entrada = ?,
        combustible_entrada = ?,
        estado_devolucion = ?,
        observaciones_entrada = ?,
        estado = 'devuelto',
        usuario_devolucion_id = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      fecha_entrada, hora_entrada || null, km_entrada || null,
      combustible_entrada || null, estado_devolucion || 'Bueno',
      observaciones_entrada || null, req.user.id, id
    ]);

    // Registrar movimiento de entrada
    query(`
      INSERT INTO movimientos (vehiculo_id, tipo_movimiento, secretaria_origen_id, usuario_id, descripcion)
      VALUES (?, 'entrada', ?, ?, ?)
    `, [asignacion.vehiculo_id, asignacion.secretaria_id, req.user.id,
        `Devuelto por ${asignacion.conductor_nombre}${km_entrada ? ` — ${km_entrada} km` : ''}`]);

    // Actualizar km del vehículo
    if (km_entrada) {
      query('UPDATE vehiculos SET kilometraje = ?, updated_at = datetime("now") WHERE id = ?', [km_entrada, asignacion.vehiculo_id]);
    }

    res.json({
      message: 'Entrada registrada exitosamente',
      folio: asignacion.folio,
      km_recorridos: km_entrada && asignacion.km_salida ? km_entrada - asignacion.km_salida : null
    });
  } catch (error) {
    console.error('Error registrando entrada:', error);
    res.status(500).json({ error: 'Error al registrar la entrada' });
  }
});

/**
 * PUT /api/asignaciones/:id/cancelar - Cancelar una asignación
 */
router.put('/:id/cancelar', authMiddleware, (req, res) => {
  try {
    const asg = query("SELECT * FROM asignaciones WHERE id = ? AND estado = 'en_uso'", [req.params.id]);
    if (asg.rows.length === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada o no está en uso' });
    }

    query(`UPDATE asignaciones SET estado = 'cancelado', observaciones_entrada = ?, updated_at = datetime('now') WHERE id = ?`,
      [req.body.motivo || 'Cancelada', req.params.id]);

    res.json({ message: 'Asignación cancelada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cancelar' });
  }
});

module.exports = router;
