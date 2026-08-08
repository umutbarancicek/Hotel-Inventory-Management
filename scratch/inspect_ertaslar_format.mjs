import fs from 'fs';
import * as XLSX from 'xlsx';

const pathErtaslar = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026.xlsx";
const buf = fs.readFileSync(pathErtaslar);
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

console.log('First 10 rows of Ertaşlar Excel:');
rows.slice(0, 10).forEach((r, idx) => {
  console.log(`Row ${idx + 1}:`, r);
});
