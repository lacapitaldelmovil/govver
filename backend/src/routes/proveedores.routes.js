/**
 * Rutas de Proveedores - SQLite
 * Gestión de proveedores por secretaría con historial de fechas
 */

const express = require('express');
const { query } = require('../database/connection');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/proveedores
 * Listar todos los proveedores
 * - Admin/Gobernación: ve todos
 * - Admin_secretaria: solo los de su secretaría
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const { secretaria_id, activo, busqueda } = req.query;
    const user = req.user;
    
    let sql = `
      SELECT p.*, 
        s.nombre as secretaria_nombre,
        s.siglas as secretaria_siglas,
        CASE 
          WHEN p.fecha_fin IS NULL THEN 'Activo'
          WHEN date(p.fecha_fin) >= date('now') THEN 'Activo'
          ELSE 'Inactivo'
        END as estado_proveeduria,
        CAST((julianday(COALESCE(p.fecha_fin, date('now'))) - julianday(p.fecha_inicio)) / 365 AS INTEGER) as anios_proveeduria
      FROM proveedores p
      LEFT JOIN secretarias s ON p.secretaria_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // Filtrar por secretaría según rol
    if (user.rol === 'admin_secretaria') {
      sql += ' AND p.secretaria_id = ?';
      params.push(user.secretaria_id);
    } else if (secretaria_id) {
      sql += ' AND p.secretaria_id = ?';
      params.push(secretaria_id);
    }

    // Filtrar por estado activo
    if (activo !== undefined) {
      sql += ' AND p.activo = ?';
      params.push(activo === 'true' || activo === '1' ? 1 : 0);
    }

    // Búsqueda por nombre o RFC
    if (busqueda) {
      sql += ' AND (p.nombre LIKE ? OR p.rfc LIKE ? OR p.giro LIKE ?)';
      const searchTerm = `%${busqueda}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY p.fecha_inicio DESC, p.nombre';

    const result = query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

/**
 * GET /api/proveedores/estadisticas
 * Estadísticas generales de proveedores
 */
router.get('/estadisticas', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    let whereClause = '';
    const params = [];

    if (user.rol === 'admin_secretaria') {
      whereClause = ' WHERE secretaria_id = ?';
      params.push(user.secretaria_id);
    }

    // Total proveedores
    const totalResult = query(`SELECT COUNT(*) as total FROM proveedores${whereClause}`, params);
    
    // Proveedores activos (fecha_fin null o futura)
    const activosResult = query(`
      SELECT COUNT(*) as total FROM proveedores 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} 
      (fecha_fin IS NULL OR date(fecha_fin) >= date('now'))
    `, params);

    // Promedio años de proveduría
    const promedioResult = query(`
      SELECT AVG(
        CAST((julianday(COALESCE(fecha_fin, date('now'))) - julianday(fecha_inicio)) / 365 AS REAL)
      ) as promedio_anios
      FROM proveedores
      ${whereClause}
    `, params);

    // Top proveedores por años
    let topSql = `
      SELECT nombre, fecha_inicio, fecha_fin,
        CAST((julianday(COALESCE(fecha_fin, date('now'))) - julianday(fecha_inicio)) / 365 AS INTEGER) as anios
      FROM proveedores
      ${whereClause}
      ORDER BY anios DESC
      LIMIT 5
    `;
    const topResult = query(topSql, params);

    // Proveedores por secretaría (solo para admin/gobernación)
    let porSecretaria = [];
    if (user.rol === 'admin' || user.rol === 'gobernacion') {
      const porSecResult = query(`
        SELECT s.nombre, s.siglas, COUNT(p.id) as total_proveedores
        FROM secretarias s
        LEFT JOIN proveedores p ON s.id = p.secretaria_id
        WHERE s.activa = 1
        GROUP BY s.id
        ORDER BY total_proveedores DESC
      `);
      porSecretaria = porSecResult.rows;
    }

    res.json({
      total: totalResult.rows[0]?.total || 0,
      activos: activosResult.rows[0]?.total || 0,
      promedio_anios: Math.round((promedioResult.rows[0]?.promedio_anios || 0) * 10) / 10,
      top_proveedores: topResult.rows,
      por_secretaria: porSecretaria
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

/**
 * GET /api/proveedores/:id
 * Obtener un proveedor específico
 */
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    let sql = `
      SELECT p.*, 
        s.nombre as secretaria_nombre,
        s.siglas as secretaria_siglas,
        CAST((julianday(COALESCE(p.fecha_fin, date('now'))) - julianday(p.fecha_inicio)) / 365 AS INTEGER) as anios_proveeduria
      FROM proveedores p
      LEFT JOIN secretarias s ON p.secretaria_id = s.id
      WHERE p.id = ?
    `;
    const params = [id];

    // Restringir por secretaría si es admin_secretaria
    if (user.rol === 'admin_secretaria') {
      sql += ' AND p.secretaria_id = ?';
      params.push(user.secretaria_id);
    }

    const result = query(sql, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo proveedor:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
});

/**
 * POST /api/proveedores
 * Crear nuevo proveedor
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    const { 
      nombre, 
      rfc, 
      contacto_nombre, 
      contacto_email, 
      contacto_telefono,
      direccion,
      giro,
      fecha_inicio,
      fecha_fin,
      secretaria_id,
      servicios,
      monto_total_contratos,
      numero_contratos,
      calificacion,
      observaciones
    } = req.body;

    // Validaciones
    if (!nombre || !fecha_inicio) {
      return res.status(400).json({ error: 'Nombre y fecha de inicio son requeridos' });
    }

    // Si es admin_secretaria, forzar su secretaría
    const finalSecretariaId = user.rol === 'admin_secretaria' 
      ? user.secretaria_id 
      : secretaria_id;

    if (!finalSecretariaId) {
      return res.status(400).json({ error: 'Se requiere una secretaría' });
    }

    const result = query(
      `INSERT INTO proveedores (
        nombre, rfc, contacto_nombre, contacto_email, contacto_telefono,
        direccion, giro, fecha_inicio, fecha_fin, secretaria_id,
        servicios, monto_total_contratos, numero_contratos, calificacion, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre, 
        rfc || null, 
        contacto_nombre || null, 
        contacto_email || null, 
        contacto_telefono || null,
        direccion || null,
        giro || null,
        fecha_inicio,
        fecha_fin || null,
        finalSecretariaId,
        servicios || null,
        monto_total_contratos || 0,
        numero_contratos || 0,
        calificacion || 0,
        observaciones || null
      ]
    );

    res.status(201).json({ 
      message: 'Proveedor creado exitosamente', 
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Error creando proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

/**
 * PUT /api/proveedores/:id
 * Actualizar proveedor
 */
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { 
      nombre, 
      rfc, 
      contacto_nombre, 
      contacto_email, 
      contacto_telefono,
      direccion,
      giro,
      fecha_inicio,
      fecha_fin,
      secretaria_id,
      servicios,
      monto_total_contratos,
      numero_contratos,
      calificacion,
      activo,
      observaciones
    } = req.body;

    // Verificar que el proveedor existe y pertenece a la secretaría (si aplica)
    let checkSql = 'SELECT id FROM proveedores WHERE id = ?';
    const checkParams = [id];

    if (user.rol === 'admin_secretaria') {
      checkSql += ' AND secretaria_id = ?';
      checkParams.push(user.secretaria_id);
    }

    const exists = query(checkSql, checkParams);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Si es admin_secretaria, no puede cambiar la secretaría
    const finalSecretariaId = user.rol === 'admin_secretaria' 
      ? user.secretaria_id 
      : secretaria_id;

    query(
      `UPDATE proveedores SET
        nombre = ?, rfc = ?, contacto_nombre = ?, contacto_email = ?, contacto_telefono = ?,
        direccion = ?, giro = ?, fecha_inicio = ?, fecha_fin = ?, secretaria_id = ?,
        servicios = ?, monto_total_contratos = ?, numero_contratos = ?, calificacion = ?,
        activo = ?, observaciones = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        nombre, 
        rfc, 
        contacto_nombre, 
        contacto_email, 
        contacto_telefono,
        direccion,
        giro,
        fecha_inicio,
        fecha_fin,
        finalSecretariaId,
        servicios,
        monto_total_contratos || 0,
        numero_contratos || 0,
        calificacion || 0,
        activo !== undefined ? (activo ? 1 : 0) : 1,
        observaciones,
        id
      ]
    );

    res.json({ message: 'Proveedor actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

/**
 * DELETE /api/proveedores/:id
 * Eliminar proveedor (soft delete - marca como inactivo)
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Verificar permisos
    let checkSql = 'SELECT id FROM proveedores WHERE id = ?';
    const checkParams = [id];

    if (user.rol === 'admin_secretaria') {
      checkSql += ' AND secretaria_id = ?';
      checkParams.push(user.secretaria_id);
    }

    const exists = query(checkSql, checkParams);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Soft delete
    query(
      `UPDATE proveedores SET activo = 0, updated_at = datetime('now') WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

module.exports = router;
