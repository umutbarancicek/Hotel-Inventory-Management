import fs from 'fs';
import * as XLSX from 'xlsx';

const path1 = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = fs.readFileSync(path1);
const wb = XLSX.read(buf, { type: 'buffer' });

console.log('=== INSPECTING Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx ===');
console.log('Sheets:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  console.log(`\nSheet "${sheetName}" Total Rows: ${rows.length}`);
  console.log('Header Row:', rows[0]);
  console.log('Sample Rows 1-5:', rows.slice(1, 6));
});
