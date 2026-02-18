/**
 * Rutas de Chat entre Secretarías - SQLite (sql.js)
 */

const express = require('express');
const { query, saveDatabase } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ═══════════════════════════════════════════════
// Asegurar tablas de chat existan
// ═══════════════════════════════════════════════
let chatTablesReady = false;
function ensureChatTables() {
  if (chatTablesReady) return;
  try {
    query('SELECT 1 FROM chat_conversaciones LIMIT 1');
    chatTablesReady = true;
  } catch (e) {
    // Crear tablas
    query(`
      CREATE TABLE IF NOT EXISTS chat_conversaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT DEFAULT 'directo',
        nombre TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    query(`
      CREATE TABLE IF NOT EXISTS chat_participantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversacion_id INTEGER NOT NULL REFERENCES chat_conversaciones(id),
        secretaria_id INTEGER NOT NULL REFERENCES secretarias(id),
        usuario_id INTEGER REFERENCES usuarios(id),
        unido_at TEXT DEFAULT (datetime('now')),
        UNIQUE(conversacion_id, secretaria_id)
      )
    `);

    query(`
      CREATE TABLE IF NOT EXISTS chat_mensajes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversacion_id INTEGER NOT NULL REFERENCES chat_conversaciones(id),
        emisor_id INTEGER NOT NULL REFERENCES usuarios(id),
        emisor_nombre TEXT,
        secretaria_id INTEGER REFERENCES secretarias(id),
        secretaria_siglas TEXT,
        contenido TEXT NOT NULL,
        tipo TEXT DEFAULT 'texto',
        leido INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    saveDatabase();
    chatTablesReady = true;
    console.log('✅ Tablas de chat creadas');
  }
}

// Middleware para asegurar tablas antes de cada request
router.use((req, res, next) => {
  ensureChatTables();
  next();
});

// ═══════════════════════════════════════════════
// GET /api/chat/conversaciones - Listar conversaciones del usuario
// ═══════════════════════════════════════════════
router.get('/conversaciones', authMiddleware, (req, res) => {
  try {
    const secId = req.user.secretaria_id;
    const userId = req.user.id;

    // Obtener conversaciones donde participa la secretaría del usuario
    const result = query(`
      SELECT c.id, c.tipo, c.nombre, c.updated_at,
        (SELECT COUNT(*) FROM chat_mensajes m 
         WHERE m.conversacion_id = c.id AND m.leido = 0 AND m.emisor_id != ?) as no_leidos,
        (SELECT m2.contenido FROM chat_mensajes m2 
         WHERE m2.conversacion_id = c.id ORDER BY m2.created_at DESC LIMIT 1) as ultimo_mensaje,
        (SELECT m3.emisor_nombre FROM chat_mensajes m3 
         WHERE m3.conversacion_id = c.id ORDER BY m3.created_at DESC LIMIT 1) as ultimo_emisor,
        (SELECT m4.created_at FROM chat_mensajes m4 
         WHERE m4.conversacion_id = c.id ORDER BY m4.created_at DESC LIMIT 1) as ultimo_mensaje_at,
        (SELECT m5.secretaria_siglas FROM chat_mensajes m5 
         WHERE m5.conversacion_id = c.id ORDER BY m5.created_at DESC LIMIT 1) as ultimo_siglas
      FROM chat_conversaciones c
      INNER JOIN chat_participantes p ON p.conversacion_id = c.id AND p.secretaria_id = ?
      ORDER BY ultimo_mensaje_at DESC NULLS LAST, c.updated_at DESC
    `, [userId, secId]);

    // Para cada conversación, obtener los participantes
    const conversaciones = result.rows.map(conv => {
      const participantes = query(`
        SELECT cp.secretaria_id, s.nombre as secretaria_nombre, s.siglas as secretaria_siglas
        FROM chat_participantes cp
        INNER JOIN secretarias s ON s.id = cp.secretaria_id
        WHERE cp.conversacion_id = ?
      `, [conv.id]);

      // Nombre de la conversación = la otra secretaría (para chat directo)
      const otra = participantes.rows.find(p => p.secretaria_id !== secId);

      return {
        ...conv,
        participantes: participantes.rows,
        nombre_display: conv.nombre || (otra ? otra.secretaria_nombre : 'Chat'),
        siglas_display: otra ? otra.secretaria_siglas : ''
      };
    });

    res.json(conversaciones);
  } catch (error) {
    console.error('Error listando conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

// ═══════════════════════════════════════════════
// POST /api/chat/conversaciones - Crear o abrir conversación con otra secretaría
// ═══════════════════════════════════════════════
router.post('/conversaciones', authMiddleware, (req, res) => {
  try {
    const { secretaria_destino_id } = req.body;
    const miSecId = req.user.secretaria_id;

    if (!secretaria_destino_id) {
      return res.status(400).json({ error: 'Se requiere secretaria_destino_id' });
    }
    if (secretaria_destino_id === miSecId) {
      return res.status(400).json({ error: 'No puedes chatear contigo mismo' });
    }

    // Verificar si ya existe conversación directa entre ambas secretarías
    const existente = query(`
      SELECT c.id FROM chat_conversaciones c
      WHERE c.tipo = 'directo'
        AND EXISTS (SELECT 1 FROM chat_participantes p1 WHERE p1.conversacion_id = c.id AND p1.secretaria_id = ?)
        AND EXISTS (SELECT 1 FROM chat_participantes p2 WHERE p2.conversacion_id = c.id AND p2.secretaria_id = ?)
    `, [miSecId, secretaria_destino_id]);

    if (existente.rows.length > 0) {
      return res.json({ id: existente.rows[0].id, existente: true });
    }

    // Crear conversación nueva
    query(`INSERT INTO chat_conversaciones (tipo) VALUES ('directo')`);
    const convIdResult = query(`SELECT MAX(id) as id FROM chat_conversaciones`);
    const convId = convIdResult.rows[0]?.id;

    // Agregar participantes
    query(`INSERT INTO chat_participantes (conversacion_id, secretaria_id, usuario_id) VALUES (?, ?, ?)`,
      [convId, miSecId, req.user.id]);
    query(`INSERT INTO chat_participantes (conversacion_id, secretaria_id) VALUES (?, ?)`,
      [convId, secretaria_destino_id]);

    res.json({ id: convId, existente: false });
  } catch (error) {
    console.error('Error creando conversación:', error);
    res.status(500).json({ error: 'Error al crear conversación' });
  }
});

// ═══════════════════════════════════════════════
// GET /api/chat/mensajes/:conversacionId - Obtener mensajes
// ═══════════════════════════════════════════════
router.get('/mensajes/:conversacionId', authMiddleware, (req, res) => {
  try {
    const { conversacionId } = req.params;
    const secId = req.user.secretaria_id;

    // Verificar que el usuario participa en la conversación
    const participa = query(`
      SELECT 1 FROM chat_participantes WHERE conversacion_id = ? AND secretaria_id = ?
    `, [conversacionId, secId]);

    if (participa.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes acceso a esta conversación' });
    }

    // Obtener mensajes
    const mensajes = query(`
      SELECT m.*, u.nombre as emisor_nombre_completo
      FROM chat_mensajes m
      LEFT JOIN usuarios u ON u.id = m.emisor_id
      WHERE m.conversacion_id = ?
      ORDER BY m.created_at ASC
    `, [conversacionId]);

    // Marcar como leídos los mensajes de otros
    query(`
      UPDATE chat_mensajes SET leido = 1 
      WHERE conversacion_id = ? AND emisor_id != ? AND leido = 0
    `, [conversacionId, req.user.id]);

    res.json(mensajes.rows);
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// ═══════════════════════════════════════════════
// POST /api/chat/mensajes - Enviar mensaje
// ═══════════════════════════════════════════════
router.post('/mensajes', authMiddleware, (req, res) => {
  try {
    const { conversacion_id, contenido } = req.body;

    if (!conversacion_id || !contenido?.trim()) {
      return res.status(400).json({ error: 'Se requiere conversacion_id y contenido' });
    }

    const secId = req.user.secretaria_id;

    // Verificar participación
    const participa = query(`
      SELECT 1 FROM chat_participantes WHERE conversacion_id = ? AND secretaria_id = ?
    `, [conversacion_id, secId]);

    if (participa.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes acceso a esta conversación' });
    }

    // Insertar mensaje
    query(`
      INSERT INTO chat_mensajes (conversacion_id, emisor_id, emisor_nombre, secretaria_id, secretaria_siglas, contenido)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      conversacion_id,
      req.user.id,
      req.user.nombre,
      secId,
      req.user.secretaria_siglas || null,
      contenido.trim()
    ]);

    const msgIdResult = query(`SELECT MAX(id) as id FROM chat_mensajes WHERE conversacion_id = ?`, [conversacion_id]);
    const msgId = msgIdResult.rows[0]?.id;

    // Actualizar timestamp de conversación
    query(`UPDATE chat_conversaciones SET updated_at = datetime('now') WHERE id = ?`, [conversacion_id]);

    res.json({
      id: msgId,
      conversacion_id,
      emisor_id: req.user.id,
      emisor_nombre: req.user.nombre,
      secretaria_id: secId,
      secretaria_siglas: req.user.secretaria_siglas,
      contenido: contenido.trim(),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// ═══════════════════════════════════════════════
// GET /api/chat/no-leidos - Contar mensajes no leídos del usuario
// ═══════════════════════════════════════════════
router.get('/no-leidos', authMiddleware, (req, res) => {
  try {
    const secId = req.user.secretaria_id;
    const userId = req.user.id;

    const result = query(`
      SELECT COUNT(*) as total FROM chat_mensajes m
      INNER JOIN chat_participantes p ON p.conversacion_id = m.conversacion_id AND p.secretaria_id = ?
      WHERE m.leido = 0 AND m.emisor_id != ?
    `, [secId, userId]);

    res.json({ total: result.rows[0]?.total || 0 });
  } catch (error) {
    console.error('Error contando no leídos:', error);
    res.status(500).json({ error: 'Error al contar mensajes' });
  }
});

// ═══════════════════════════════════════════════
// GET /api/chat/secretarias - Listar secretarías disponibles para chatear
// ═══════════════════════════════════════════════
router.get('/secretarias', authMiddleware, (req, res) => {
  try {
    const secId = req.user.secretaria_id;

    const result = query(`
      SELECT id, nombre, siglas FROM secretarias 
      WHERE activa = 1 AND id != ?
      ORDER BY siglas ASC
    `, [secId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error listando secretarías:', error);
    res.status(500).json({ error: 'Error al obtener secretarías' });
  }
});

module.exports = router;
