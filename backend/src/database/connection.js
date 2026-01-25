/**
 * Conexión a SQLite usando sql.js
 * Base de datos local en archivo
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../flota_veracruz.sqlite');

let db = null;

// Inicializar la base de datos
async function initDatabase() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  try {
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    console.log('✅ Base de datos SQLite conectada:', dbPath);
    return db;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
}

// Guardar cambios al archivo
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Función query compatible con el código existente
function query(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  
  try {
    // Reemplazar placeholders $1, $2, etc. con ?
    const sqlWithQuestionMarks = sql.replace(/\$\d+/g, '?');
    
    // Detectar si es SELECT o INSERT/UPDATE/DELETE
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    
    if (isSelect) {
      const stmt = db.prepare(sqlWithQuestionMarks);
      stmt.bind(params);
      
      const rows = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push(row);
      }
      stmt.free();
      
      return { rows };
    } else {
      db.run(sqlWithQuestionMarks, params);
      saveDatabase();
      
      // Obtener el último ID insertado
      const result = db.exec('SELECT last_insert_rowid() as id');
      const lastInsertRowid = result.length > 0 ? result[0].values[0][0] : null;
      
      return { rows: [], lastInsertRowid };
    }
  } catch (error) {
    console.error('SQL Error:', error);
    console.error('Query:', sql);
    console.error('Params:', params);
    throw error;
  }
}

// Cerrar la base de datos
function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('Base de datos cerrada');
  }
}

// Obtener la instancia raw de la base de datos
function getDb() {
  return db;
}

module.exports = { 
  initDatabase,
  query, 
  closeDatabase, 
  getDb,
  saveDatabase
};
