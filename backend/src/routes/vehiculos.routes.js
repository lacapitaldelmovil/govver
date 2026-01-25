/**
 * Rutas de Vehículos - SQLite
 */

const express = require('express');
const { query } = require('../database/connection');
const { authMiddleware, requireAdminSecretaria } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/vehiculos/municipios - Obtener lista de municipios únicos
 * NOTA: Esta ruta debe estar ANTES de /:id para que no se confunda
 */
router.get('/municipios', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT DISTINCT municipio 
      FROM vehiculos 
      WHERE activo = 1 AND municipio IS NOT NULL AND municipio != ''
      ORDER BY municipio
    `);
    
    const municipios = result.rows.map(r => r.municipio);
    res.json(municipios);
  } catch (error) {
    console.error('Error obteniendo municipios:', error);
    res.status(500).json({ error: 'Error al obtener municipios' });
  }
});

/**
 * GET /api/vehiculos - Listar vehículos con filtros
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const { 
      secretaria_id, estado_operativo, regimen, marca, tipo, estatus, clasificacion, proveedor, municipio,
      busqueda, todos, page = 1, limit = 1000 
    } = req.query;
    
    let sql = `
      SELECT v.*, s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
      FROM vehiculos v
      LEFT JOIN secretarias s ON v.secretaria_id = s.id
      WHERE v.activo = 1
    `;
    const params = [];
    
    // Si es admin_secretaria, solo puede ver su secretaría (a menos que se pida todos)
    const esAdmin = ['admin', 'gobernacion'].includes(req.user.rol);
    if (req.user.rol === 'admin_secretaria' && req.user.secretaria_id && !todos) {
      sql += ' AND v.secretaria_id = ?';
      params.push(req.user.secretaria_id);
    } else if (secretaria_id && !todos) {
      // Admin y Gobernación pueden filtrar por secretaría
      sql += ' AND v.secretaria_id = ?';
      params.push(secretaria_id);
    }
    
    if (estado_operativo) {
      sql += ' AND v.estado_operativo = ?';
      params.push(estado_operativo);
    }
    if (estatus) {
      sql += ' AND v.estatus = ?';
      params.push(estatus);
    }
    if (clasificacion) {
      sql += ' AND v.clasificacion = ?';
      params.push(clasificacion);;
    }
    if (regimen) {
      sql += ' AND v.regimen = ?';
      params.push(regimen);
    }
    if (marca) {
      sql += ' AND v.marca = ?';
      params.push(marca);
    }
    if (tipo) {
      sql += ' AND v.tipo = ?';
      params.push(tipo);
    }
    if (proveedor) {
      sql += ' AND UPPER(v.proveedor_arrendadora) LIKE UPPER(?)';
      params.push(`%${proveedor}%`);
    }
    if (municipio) {
      sql += ' AND v.municipio = ?';
      params.push(municipio);
    }
    if (busqueda) {
      sql += ' AND (v.placas LIKE ? OR v.numero_serie LIKE ? OR v.numero_inventario LIKE ? OR v.marca LIKE ? OR v.descripcion LIKE ?)';
      const term = `%${busqueda}%`;
      params.push(term, term, term, term, term);
    }
    
    sql += ' ORDER BY v.created_at DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const result = query(sql, params);
    
    // Contar total
    let countSql = 'SELECT COUNT(*) as total FROM vehiculos v WHERE v.activo = 1';
    const countParams = [];
    
    // Aplicar mismo filtro de secretaría para el contador
    if (req.user.rol === 'admin_secretaria' && req.user.secretaria_id) {
      countSql += ' AND v.secretaria_id = ?';
      countParams.push(req.user.secretaria_id);
    } else if (secretaria_id) {
      countSql += ' AND v.secretaria_id = ?';
      countParams.push(secretaria_id);
    }
    
    const countResult = query(countSql, countParams);
    
    res.json({
      vehiculos: result.rows,
      total: countResult.rows[0]?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error listando vehículos:', error);
    res.status(500).json({ error: 'Error al listar vehículos' });
  }
});

/**
 * GET /api/vehiculos/:id - Obtener vehículo por ID
 */
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT v.*, s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
      FROM vehiculos v
      LEFT JOIN secretarias s ON v.secretaria_id = s.id
      WHERE v.id = ?
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // Obtener movimientos del vehículo (con manejo de errores por si no existe la tabla)
    let movimientos = { rows: [] };
    try {
      movimientos = query(`
        SELECT m.*, 
          so.nombre as secretaria_origen_nombre, so.siglas as secretaria_origen_siglas,
          sd.nombre as secretaria_destino_nombre, sd.siglas as secretaria_destino_siglas
        FROM movimientos m
        LEFT JOIN secretarias so ON m.secretaria_origen_id = so.id
        LEFT JOIN secretarias sd ON m.secretaria_destino_id = sd.id
        WHERE m.vehiculo_id = ?
        ORDER BY m.created_at DESC
        LIMIT 10
      `, [req.params.id]);
    } catch (e) {
      // Tabla de movimientos puede tener estructura diferente
      console.log('Info: tabla movimientos no disponible');
    }

    // Obtener mantenimientos del vehículo (si existe la tabla)
    let mantenimientos = { rows: [] };
    try {
      mantenimientos = query(`
        SELECT * FROM mantenimientos 
        WHERE vehiculo_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `, [req.params.id]);
    } catch (e) {
      // Tabla de mantenimientos puede no existir
    }
    
    res.json({
      vehiculo: result.rows[0],
      movimientos: movimientos.rows,
      mantenimientos: mantenimientos.rows
    });
  } catch (error) {
    console.error('Error obteniendo vehículo:', error);
    res.status(500).json({ error: 'Error al obtener vehículo' });
  }
});

/**
 * POST /api/vehiculos - Crear vehículo
 */
router.post('/', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    const {
      numero_inventario, numero_economico, placas, numero_serie,
      descripcion, descripcion_detallada, marca, modelo, anio, color, tipo,
      valor_libros, fecha_adquisicion,
      ubicacion_fisica, municipio, secretaria_id, area_responsable,
      tarjeta_circulacion, vigencia_tarjeta,
      estado_operativo, estatus, kilometraje,
      seguro, poliza_seguro, vigencia_seguro,
      regimen, proveedor_arrendadora, renta_mensual, vigencia_contrato,
      telefono_area, quien_reporta,
      resguardante_nombre, resguardante_cargo, resguardante_telefono,
      observaciones
    } = req.body;
    
    const result = query(`
      INSERT INTO vehiculos (
        numero_inventario, numero_economico, placas, numero_serie,
        descripcion, descripcion_detallada, marca, modelo, anio, color, tipo,
        valor_libros, fecha_adquisicion,
        ubicacion_fisica, municipio, secretaria_id, area_responsable,
        tarjeta_circulacion, vigencia_tarjeta,
        estado_operativo, estatus, kilometraje,
        seguro, poliza_seguro, vigencia_seguro,
        regimen, proveedor_arrendadora, renta_mensual, vigencia_contrato,
        telefono_area, quien_reporta,
        resguardante_nombre, resguardante_cargo, resguardante_telefono,
        observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      numero_inventario || null, numero_economico || null, placas || null, numero_serie || null,
      descripcion || null, descripcion_detallada || null, marca, modelo, anio || null, color || null, tipo || null,
      valor_libros || null, fecha_adquisicion || null,
      ubicacion_fisica || null, municipio || null, secretaria_id || null, area_responsable || null,
      tarjeta_circulacion || null, vigencia_tarjeta || null,
      estado_operativo || 'Operando', estatus || null, kilometraje || 0,
      seguro || null, poliza_seguro || null, vigencia_seguro || null,
      regimen || 'Propio', proveedor_arrendadora || null, renta_mensual || null, vigencia_contrato || null,
      telefono_area || null, quien_reporta || null,
      resguardante_nombre || null, resguardante_cargo || null, resguardante_telefono || null,
      observaciones || null
    ]);
    
    res.status(201).json({ 
      message: 'Vehículo creado exitosamente',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creando vehículo:', error);
    res.status(500).json({ error: 'Error al crear vehículo' });
  }
});

/**
 * PUT /api/vehiculos/:id - Actualizar vehículo
 */
router.put('/:id', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    
    // Construir query dinámicamente
    const updates = [];
    const params = [];
    
    const allowedFields = [
      'numero_inventario', 'numero_economico', 'placas', 'numero_serie',
      'descripcion', 'descripcion_detallada', 'marca', 'modelo', 'anio', 'color', 'tipo',
      'valor_libros', 'fecha_adquisicion',
      'ubicacion_fisica', 'municipio', 'secretaria_id', 'area_responsable',
      'tarjeta_circulacion', 'vigencia_tarjeta',
      'estado_operativo', 'estatus', 'en_uso', 'kilometraje',
      'seguro', 'poliza_seguro', 'vigencia_seguro',
      'regimen', 'proveedor_arrendadora', 'renta_mensual', 'vigencia_contrato',
      'telefono_area', 'quien_reporta',
      'resguardante_nombre', 'resguardante_cargo', 'resguardante_telefono',
      'observaciones', 'situacion_juridica', 'activo', 'propuesto_baja', 'fecha_propuesta_baja', 'motivo_propuesta_baja'
    ];
    
    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(fields[field]);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    updates.push("updated_at = datetime('now')");
    params.push(id);
    
    query(`UPDATE vehiculos SET ${updates.join(', ')} WHERE id = ?`, params);
    
    res.json({ message: 'Vehículo actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando vehículo:', error);
    res.status(500).json({ error: 'Error al actualizar vehículo' });
  }
});

/**
 * DELETE /api/vehiculos/:id - Eliminar (soft delete)
 */
router.delete('/:id', authMiddleware, requireAdminSecretaria, (req, res) => {
  try {
    query("UPDATE vehiculos SET activo = 0, updated_at = datetime('now') WHERE id = ?", [req.params.id]);
    res.json({ message: 'Vehículo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando vehículo:', error);
    res.status(500).json({ error: 'Error al eliminar vehículo' });
  }
});

/**
 * GET /api/vehiculos/stats/marcas - Estadísticas por marca
 */
router.get('/stats/marcas', authMiddleware, (req, res) => {
  try {
    const result = query(`
      SELECT marca, COUNT(*) as cantidad
      FROM vehiculos
      WHERE activo = 1
      GROUP BY marca
      ORDER BY cantidad DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
