const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'PADRON VEHICULAR 2026 DIRECCION GENERAL.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('=== BUSCANDO PROPUESTO PARA BAJA ===\n');
for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
  const row = data[rowIndex];
  if (!row) continue;
  for (let colIndex = 0; colIndex < row.length; colIndex++) {
    const cell = String(row[colIndex] || '').toUpperCase();
    if (cell.includes('PROPUESTO') || (cell.includes('BAJA') && !cell.includes('PENDIENTE'))) {
      console.log('Fila', rowIndex, 'Columna', colIndex, ':', row[colIndex]);
      // Mostrar contexto de toda la fila
      if (rowIndex < 20) {
        console.log('  -> Fila completa:', row.slice(0, 20));
      }
    }
  }
}
