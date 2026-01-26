/**
 * Conexión a SQLite usando sql.js
 * Base de datos local en archivo
 */

const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../flota_veracruz.sqlite');

let db = null;

// Resetear contraseñas de usuarios principales
async function resetPasswords() {
  if (!db) return;
  
  try {
    const adminHash = await bcrypt.hash('Admin2024!', 10);
    const gobHash = await bcrypt.hash('Gobernacion2024!', 10);
    const difHash = await bcrypt.hash('Dif2024!', 10);
    
    // Actualizar contraseña del superadmin
    db.run("UPDATE usuarios SET password = ? WHERE email = 'superadmin@veracruz.gob.mx'", [adminHash]);
    
    // Actualizar contraseña de gobernadora
    db.run("UPDATE usuarios SET password = ? WHERE email = 'gobernadora@veracruz.gob.mx'", [gobHash]);
    
    // Actualizar contraseña admin DIF
    db.run("UPDATE usuarios SET password = ? WHERE email = 'admin.dif@veracruz.gob.mx'", [difHash]);
    
    saveDatabase();
    console.log('✅ Contraseñas de usuarios principales reseteadas');
  } catch (error) {
    console.error('Error reseteando contraseñas:', error);
  }
}

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
    
    // Resetear contraseñas al iniciar
    await resetPasswords();
    
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
