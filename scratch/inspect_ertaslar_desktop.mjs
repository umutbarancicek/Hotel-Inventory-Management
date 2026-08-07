import fs from 'fs';
import * as XLSX from 'xlsx';

const filePath = "C:\\Users\\Baran\\Desktop\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";

const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', raw: true });

console.log('Sheets:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  console.log(`\n=== Sheet: "${sheetName}" | Rows: ${rows.length} ===`);
  rows.slice(0, 8).forEach((r, i) => console.log(`  Row ${i}: ${JSON.stringify(r)}`));
  if (rows.length > 10) {
    console.log('  ...');
    console.log(`  Row 10: ${JSON.stringify(rows[10])}`);
    console.log(`  Row 20: ${JSON.stringify(rows[20] || [])}`);
    console.log(`  Row 50: ${JSON.stringify(rows[50] || [])}`);
  }
});
