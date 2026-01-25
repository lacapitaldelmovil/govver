/**
 * Rutas de Secretarías - SQLite
 */

const express = require('express');
const { query } = require('../database/connection');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/secretarias
 * Listar todas las secretarías
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM vehiculos WHERE secretaria_id = s.id) as total_vehiculos
      FROM secretarias s
      WHERE s.activa = 1
      ORDER BY s.nombre
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando secretarías:', error);
    res.status(500).json({ error: 'Error al obtener secretarías' });
  }
});

/**
 * GET /api/secretarias/:id
 */
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const result = query('SELECT * FROM secretarias WHERE id = ?', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Secretaría no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo secretaría:', error);
    res.status(500).json({ error: 'Error al obtener secretaría' });
  }
});

/**
 * POST /api/secretarias
 */
router.post('/', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { nombre, siglas, titular, direccion, telefono, email } = req.body;
    
    const result = query(
      `INSERT INTO secretarias (nombre, siglas, titular, direccion, telefono, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, siglas, titular, direccion, telefono, email]
    );
    
    res.status(201).json({ message: 'Secretaría creada', id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creando secretaría:', error);
    res.status(500).json({ error: 'Error al crear secretaría' });
  }
});

/**
 * PUT /api/secretarias/:id
 */
router.put('/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, siglas, titular, direccion, telefono, email, activa } = req.body;
    
    query(
      `UPDATE secretarias 
       SET nombre = ?, siglas = ?, titular = ?, direccion = ?, 
           telefono = ?, email = ?, activa = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [nombre, siglas, titular, direccion, telefono, email, activa ? 1 : 0, id]
    );
    
    res.json({ message: 'Secretaría actualizada' });
  } catch (error) {
    console.error('Error actualizando secretaría:', error);
    res.status(500).json({ error: 'Error al actualizar secretaría' });
  }
});

module.exports = router;
