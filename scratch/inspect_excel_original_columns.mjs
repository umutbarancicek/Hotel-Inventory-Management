import fs from 'fs';
import * as XLSX from 'xlsx';

const excelPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = fs.readFileSync(excelPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log('Excel Sheet Header (Row 0):', rows[0]);
console.log('\nSample Excel Rows (1 to 10):');
rows.slice(1, 11).forEach((r, idx) => console.log(`Row ${idx+1}:`, r));
