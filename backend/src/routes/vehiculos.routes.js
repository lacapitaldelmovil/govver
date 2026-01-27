/**
 * Rutas de Vehículos - SQLite
 */

const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { query } = require('../database/connection');
const { authMiddleware, requireAdminSecretaria } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * GET /api/vehiculos/plantilla - Descargar plantilla Excel con listas desplegables
 */
router.get('/plantilla', authMiddleware, (req, res) => {
  try {
    // Obtener secretarías disponibles
    const secretariasResult = query('SELECT siglas FROM secretarias WHERE activa = 1 ORDER BY siglas');
    const secretariasList = secretariasResult.rows.map(s => s.siglas);

    // Crear workbook
    const wb = xlsx.utils.book_new();

    // Datos de ejemplo
    const data = [
      // Encabezados
      ['numero_inventario', 'placas', 'marca', 'linea', 'anio', 'numero_serie', 'numero_motor', 'color', 
       'tipo', 'capacidad_pasajeros', 'tipo_combustible', 'cilindros', 'transmision', 'regimen', 
       'secretaria_siglas', 'municipio', 'ubicacion_fisica', 'estado_operativo', 'estatus', 
       'resguardante_nombre', 'resguardante_cargo', 'resguardante_telefono', 'area_responsable', 
       'numero_economico', 'valor_libros', 'fecha_adquisicion', 'kilometraje', 'seguro', 
       'poliza_seguro', 'vigencia_seguro', 'tarjeta_circulacion', 'vigencia_tarjeta', 
       'proveedor_arrendadora', 'renta_mensual', 'vigencia_contrato', 'observaciones'],
      // Ejemplo 1
      ['VER-2024-001', 'ABC-123-A', 'TOYOTA', 'HILUX', 2024, '1HGCG5655WA123456', 'MOT-12345', 'Blanco',
       'pickup', 5, 'Gasolina', 4, 'Automatica', 'Propio', 'DIF', 'Xalapa', 'Oficinas Centrales',
       'Operando', 'Bueno', 'Juan Pérez', 'Director', '228-123-4567', 'Dirección General',
       'ECO-001', 450000, '2024-01-15', 15000, 'Si', 'POL-001', '2025-01-15', 'Vigente', '2025-06-30',
       '', '', '', 'Vehículo en excelente estado'],
      // Ejemplo 2
      ['VER-2024-002', 'XYZ-456-B', 'NISSAN', 'VERSA', 2023, '3N1BC1AS0ZK654321', 'MOT-67890', 'Gris',
       'sedan', 5, 'Gasolina', 4, 'Manual', 'Arrendado', 'GOB', 'Veracruz', 'Palacio de Gobierno',
       'Operando', 'Bueno', 'María López', 'Secretaria', '229-987-6543', 'Secretaría Particular',
       'ECO-002', '', '', 8000, 'Si', 'POL-ARR-002', '2025-12-31', 'Vigente', '2025-12-31',
       'Arrendadora SA', 8500, '2025-06-30', 'Vehículo arrendado']
    ];

    const ws = xlsx.utils.aoa_to_sheet(data);

    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 18 }, // numero_inventario
      { wch: 12 }, // placas
      { wch: 15 }, // marca
      { wch: 12 }, // linea
      { wch: 6 },  // anio
      { wch: 20 }, // numero_serie
      { wch: 12 }, // numero_motor
      { wch: 10 }, // color
      { wch: 12 }, // tipo
      { wch: 8 },  // capacidad
      { wch: 12 }, // combustible
      { wch: 8 },  // cilindros
      { wch: 12 }, // transmision
      { wch: 10 }, // regimen
      { wch: 10 }, // secretaria
      { wch: 15 }, // municipio
      { wch: 20 }, // ubicacion
      { wch: 12 }, // estado_op
      { wch: 10 }, // estatus
      { wch: 20 }, // resguardante
      { wch: 15 }, // cargo
      { wch: 15 }, // telefono
      { wch: 18 }, // area
      { wch: 12 }, // num_econ
      { wch: 12 }, // valor
      { wch: 12 }, // fecha_adq
      { wch: 10 }, // km
      { wch: 8 },  // seguro
      { wch: 12 }, // poliza
      { wch: 12 }, // vig_seguro
      { wch: 12 }, // tarjeta
      { wch: 12 }, // vig_tarjeta
      { wch: 20 }, // arrendadora
      { wch: 12 }, // renta
      { wch: 12 }, // vig_contrato
      { wch: 30 }  // observaciones
    ];

    // Crear hoja de catálogos para las listas desplegables
    const catalogos = [
      ['TIPO', 'COMBUSTIBLE', 'TRANSMISION', 'REGIMEN', 'ESTADO_OPERATIVO', 'ESTATUS', 'SEGURO', 'TARJETA', 'SECRETARIAS'],
      ['sedan', 'Gasolina', 'Automatica', 'Propio', 'Operando', 'Bueno', 'Si', 'Vigente', secretariasList[0] || 'DIF'],
      ['camioneta', 'Diesel', 'Manual', 'Arrendado', 'Mal estado', 'Regular', 'No', 'No vigente', secretariasList[1] || 'GOB'],
      ['pickup', 'Electrico', '', 'Comodato', 'En taller', 'Malo', '', 'En trámite', secretariasList[2] || 'SSP'],
      ['suv', 'Hibrido', '', '', 'Siniestrado', '', '', 'No aplica', secretariasList[3] || 'SALUD'],
      ['van', 'Gas', '', '', 'Baja', '', '', '', secretariasList[4] || 'SEV'],
      ['autobus', '', '', '', '', '', '', '', secretariasList[5] || 'SEFIPLAN'],
      ['motocicleta', '', '', '', '', '', '', '', secretariasList[6] || ''],
      ['maquinaria', '', '', '', '', '', '', '', secretariasList[7] || ''],
      ['emergencia', '', '', '', '', '', '', '', secretariasList[8] || ''],
      ['otro', '', '', '', '', '', '', '', secretariasList[9] || '']
    ];

    const wsCatalogos = xlsx.utils.aoa_to_sheet(catalogos);
    
    xlsx.utils.book_append_sheet(wb, ws, 'Vehiculos');
    xlsx.utils.book_append_sheet(wb, wsCatalogos, 'Catalogos');

    // Generar buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_vehiculos_veracruz.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Error generando plantilla:', error);
    res.status(500).json({ error: 'Error al generar plantilla' });
  }
});

/**
 * POST /api/vehiculos/carga-masiva - Carga masiva desde Excel/CSV
 */
router.post('/carga-masiva', authMiddleware, requireAdminSecretaria, upload.single('archivo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (data.length === 0) {
      return res.status(400).json({ error: 'El archivo está vacío' });
    }

    const resultados = { insertados: 0, actualizados: 0, errores: [] };

    // Mapa de secretarías
    const secretariasResult = query('SELECT id, siglas FROM secretarias');
    const secretariasMap = {};
    secretariasResult.rows.forEach(s => {
      secretariasMap[s.siglas.toUpperCase()] = s.id;
    });

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const fila = i + 2;

      try {
        const numero_inventario = row.numero_inventario?.toString().trim();
        const placas = row.placas?.toString().trim();
        const marca = row.marca?.toString().trim();
        const linea = row.linea?.toString().trim();
        const anio = row.anio?.toString().trim();
        const numero_serie = row.numero_serie?.toString().trim();
        const numero_motor = row.numero_motor?.toString().trim();
        const color = row.color?.toString().trim();
        const tipo = row.tipo?.toString().toLowerCase().trim();
        const capacidad_pasajeros = parseInt(row.capacidad_pasajeros) || null;
        const tipo_combustible = row.tipo_combustible?.toString().trim();
        const cilindros = parseInt(row.cilindros) || null;
        const transmision = row.transmision?.toString().toLowerCase().trim();
        const regimen = row.regimen?.toString().trim() || 'Propio';
        const secretaria_siglas = row.secretaria_siglas?.toString().toUpperCase().trim();
        const municipio = row.municipio?.toString().trim();
        const ubicacion_fisica = row.ubicacion_fisica?.toString().trim();
        const estado_operativo = row.estado_operativo?.toString().trim() || 'Operando';
        const estatus = row.estatus?.toString().trim();
        const resguardante_nombre = row.resguardante_nombre?.toString().trim();
        const resguardante_cargo = row.resguardante_cargo?.toString().trim();
        const resguardante_telefono = row.resguardante_telefono?.toString().trim();
        const area_responsable = row.area_responsable?.toString().trim();
        const numero_economico = row.numero_economico?.toString().trim();
        const valor_libros = parseFloat(row.valor_libros) || null;
        const fecha_adquisicion = row.fecha_adquisicion?.toString().trim();
        const kilometraje = parseInt(row.kilometraje) || 0;
        const seguro = row.seguro?.toString().trim();
        const poliza_seguro = row.poliza_seguro?.toString().trim();
        const vigencia_seguro = row.vigencia_seguro?.toString().trim();
        const tarjeta_circulacion = row.tarjeta_circulacion?.toString().trim();
        const vigencia_tarjeta = row.vigencia_tarjeta?.toString().trim();
        const proveedor_arrendadora = row.proveedor_arrendadora?.toString().trim();
        const renta_mensual = parseFloat(row.renta_mensual) || null;
        const vigencia_contrato = row.vigencia_contrato?.toString().trim();
        const observaciones = row.observaciones?.toString().trim();

        // Validaciones
        if (!numero_inventario) { resultados.errores.push({ fila, mensaje: 'Falta numero_inventario' }); continue; }
        if (!placas) { resultados.errores.push({ fila, mensaje: 'Falta placas' }); continue; }
        if (!marca) { resultados.errores.push({ fila, mensaje: 'Falta marca' }); continue; }
        if (!secretaria_siglas) { resultados.errores.push({ fila, mensaje: 'Falta secretaria_siglas' }); continue; }

        const secretaria_id = secretariasMap[secretaria_siglas];
        if (!secretaria_id) { resultados.errores.push({ fila, mensaje: `Secretaría "${secretaria_siglas}" no encontrada` }); continue; }

        const tiposValidos = ['sedan', 'camioneta', 'pickup', 'suv', 'van', 'autobus', 'motocicleta', 'maquinaria', 'emergencia', 'otro'];
        const tipoFinal = tiposValidos.includes(tipo) ? tipo : 'otro';

        // Verificar si existe
        const existente = query('SELECT id FROM vehiculos WHERE numero_inventario = ?', [numero_inventario]);

        // Construir descripción combinada
        const descripcion = linea ? `${marca} ${linea}` : marca;

        if (existente.rows.length > 0) {
          query(`UPDATE vehiculos SET 
            placas=?, numero_serie=?, marca=?, modelo=?, anio=?, linea=?, numero_motor=?, 
            color=?, tipo=?, capacidad_pasajeros=?, tipo_combustible=?, cilindros=?, transmision=?, regimen=?, 
            secretaria_id=?, municipio=?, ubicacion_fisica=?, estado_operativo=?, estatus=?, resguardante_nombre=?, 
            resguardante_cargo=?, resguardante_telefono=?, area_responsable=?, numero_economico=?, valor_libros=?, 
            fecha_adquisicion=?, kilometraje=?, seguro=?, poliza_seguro=?, vigencia_seguro=?, tarjeta_circulacion=?, 
            vigencia_tarjeta=?, proveedor_arrendadora=?, renta_mensual=?, vigencia_contrato=?, observaciones=?,
            descripcion=?, activo=1, updated_at=datetime('now') 
            WHERE numero_inventario=?`,
            [placas, numero_serie, marca, linea || '', anio, linea, numero_motor, 
             color, tipoFinal, capacidad_pasajeros, tipo_combustible, cilindros, transmision, regimen, 
             secretaria_id, municipio, ubicacion_fisica, estado_operativo, estatus, resguardante_nombre, 
             resguardante_cargo, resguardante_telefono, area_responsable, numero_economico, valor_libros, 
             fecha_adquisicion, kilometraje, seguro, poliza_seguro, vigencia_seguro, tarjeta_circulacion, 
             vigencia_tarjeta, proveedor_arrendadora, renta_mensual, vigencia_contrato, observaciones,
             descripcion, numero_inventario]);
          resultados.actualizados++;
        } else {
          query(`INSERT INTO vehiculos (
            numero_inventario, placas, numero_serie, marca, modelo, anio, linea, numero_motor,
            color, tipo, capacidad_pasajeros, tipo_combustible, cilindros, transmision, regimen, 
            secretaria_id, municipio, ubicacion_fisica, estado_operativo, estatus, resguardante_nombre,
            resguardante_cargo, resguardante_telefono, area_responsable, numero_economico, valor_libros, 
            fecha_adquisicion, kilometraje, seguro, poliza_seguro, vigencia_seguro, tarjeta_circulacion, 
            vigencia_tarjeta, proveedor_arrendadora, renta_mensual, vigencia_contrato, observaciones, 
            descripcion, activo, en_uso
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,1)`,
            [numero_inventario, placas, numero_serie, marca, linea || '', anio, linea, numero_motor, 
             color, tipoFinal, capacidad_pasajeros, tipo_combustible, cilindros, transmision, regimen, 
             secretaria_id, municipio, ubicacion_fisica, estado_operativo, estatus, resguardante_nombre,
             resguardante_cargo, resguardante_telefono, area_responsable, numero_economico, valor_libros, 
             fecha_adquisicion, kilometraje, seguro, poliza_seguro, vigencia_seguro, tarjeta_circulacion, 
             vigencia_tarjeta, proveedor_arrendadora, renta_mensual, vigencia_contrato, observaciones,
             descripcion]);
          resultados.insertados++;
        }
      } catch (err) {
        resultados.errores.push({ fila, mensaje: err.message });
      }
    }

    res.json({ exito: true, ...resultados });
  } catch (error) {
    console.error('Error en carga masiva:', error);
    res.status(500).json({ error: error.message || 'Error al procesar archivo' });
  }
});

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
      'descripcion', 'descripcion_detallada', 'marca', 'modelo', 'linea', 'anio', 'color', 'tipo',
      'numero_motor', 'capacidad_pasajeros', 'tipo_combustible', 'cilindros', 'transmision',
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
