/**
 * Rutas de Usuarios - SQLite
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../database/connection');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/usuarios - Listar usuarios
 */
router.get('/', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { secretaria_id } = req.query;
    
    let sql = `
      SELECT u.id, u.email, u.nombre, u.cargo, u.telefono, u.rol, 
             u.secretaria_id, u.activo, u.ultimo_acceso, u.created_at,
             s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
      FROM usuarios u
      LEFT JOIN secretarias s ON u.secretaria_id = s.id
    `;
    
    const params = [];
    if (secretaria_id) {
      sql += ' WHERE u.secretaria_id = ?';
      params.push(secretaria_id);
    }
    
    sql += ' ORDER BY u.nombre';
    
    const result = query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

/**
 * GET /api/usuarios/:id - Obtener usuario por ID
 */
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT u.id, u.email, u.nombre, u.cargo, u.telefono, u.rol,
             u.secretaria_id, u.activo, u.ultimo_acceso, u.created_at,
             s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
      FROM usuarios u
      LEFT JOIN secretarias s ON u.secretaria_id = s.id
      WHERE u.id = ?
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

/**
 * POST /api/usuarios - Crear usuario
 */
router.post('/', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { email, password, nombre, rol, secretaria_id, telefono, cargo } = req.body;
    
    // Verificar email único
    const existing = query('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = query(`
      INSERT INTO usuarios (email, password, nombre, rol, secretaria_id, telefono, cargo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [email.toLowerCase(), hashedPassword, nombre, rol, secretaria_id || null, telefono || null, cargo || null]);
    
    res.status(201).json({ 
      message: 'Usuario creado exitosamente',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

/**
 * PUT /api/usuarios/:id - Actualizar usuario
 */
router.put('/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { email, nombre, rol, secretaria_id, telefono, cargo, activo } = req.body;
    
    const updates = [];
    const params = [];
    
    if (email) { updates.push('email = ?'); params.push(email.toLowerCase()); }
    if (nombre) { updates.push('nombre = ?'); params.push(nombre); }
    if (rol) { updates.push('rol = ?'); params.push(rol); }
    if (secretaria_id !== undefined) { updates.push('secretaria_id = ?'); params.push(secretaria_id); }
    if (telefono !== undefined) { updates.push('telefono = ?'); params.push(telefono); }
    if (cargo !== undefined) { updates.push('cargo = ?'); params.push(cargo); }
    if (activo !== undefined) { updates.push('activo = ?'); params.push(activo ? 1 : 0); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    updates.push("updated_at = datetime('now')");
    params.push(id);
    
    query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);
    
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

/**
 * DELETE /api/usuarios/:id - Desactivar usuario
 */
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    query("UPDATE usuarios SET activo = 0, updated_at = datetime('now') WHERE id = ?", [req.params.id]);
    res.json({ message: 'Usuario desactivado exitosamente' });
  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

/**
 * PUT /api/usuarios/:id/password - Resetear contraseña
 */
router.put('/:id/password', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    query("UPDATE usuarios SET password = ?, updated_at = datetime('now') WHERE id = ?", 
      [hashedPassword, req.params.id]);
    
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

module.exports = router;
