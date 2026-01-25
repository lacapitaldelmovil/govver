/**
 * Rutas de Movimientos - SQLite
 */

const express = require('express');
const { query } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/movimientos
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const { vehiculo_id, tipo, limit = 50 } = req.query;
    
    let whereConditions = [];
    let params = [];
    
    if (vehiculo_id) {
      whereConditions.push('m.vehiculo_id = ?');
      params.push(vehiculo_id);
    }
    
    if (tipo) {
      whereConditions.push('m.tipo_movimiento = ?');
      params.push(tipo);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const result = query(`
      SELECT m.*, 
        v.marca, v.linea, v.placas,
        u.nombre as usuario_nombre,
        so.siglas as secretaria_origen_siglas,
        sd.siglas as secretaria_destino_siglas
      FROM movimientos m
      LEFT JOIN vehiculos v ON m.vehiculo_id = v.id
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      LEFT JOIN secretarias so ON m.secretaria_origen_id = so.id
      LEFT JOIN secretarias sd ON m.secretaria_destino_id = sd.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ?
    `, [...params, parseInt(limit)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error listando movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

/**
 * POST /api/movimientos
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const { vehiculo_id, tipo_movimiento, secretaria_origen_id, secretaria_destino_id, descripcion, observaciones } = req.body;
    
    const result = query(
      `INSERT INTO movimientos (vehiculo_id, tipo_movimiento, secretaria_origen_id, secretaria_destino_id, usuario_id, descripcion, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vehiculo_id, tipo_movimiento, secretaria_origen_id, secretaria_destino_id, req.user.id, descripcion, observaciones]
    );
    
    res.status(201).json({ message: 'Movimiento registrado', id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creando movimiento:', error);
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
});

module.exports = router;
