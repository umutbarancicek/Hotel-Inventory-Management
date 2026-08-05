import fs from 'fs';
import * as XLSX from 'xlsx';

const excelPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const excelBuf = fs.readFileSync(excelPath);
const wb = XLSX.read(excelBuf, { type: 'buffer', raw: true });

const sheet = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

console.log(`Total rows in Sheet: ${rows.length}`);
console.log('\n--- LAST 20 ROWS IN SHEET ---');
for (let i = Math.max(0, rows.length - 20); i < rows.length; i++) {
  console.log(`Row ${i}:`, JSON.stringify(rows[i]));
}
