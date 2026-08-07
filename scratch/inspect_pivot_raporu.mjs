import fs from 'fs';
import * as XLSX from 'xlsx';

const filePath = "C:\\Users\\Baran\\Desktop\\pivot_sevk_raporu_2026-08-04 (2).xlsx";

const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', raw: true });

console.log('Sheets:', wb.SheetNames);

// Check each sheet
wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  console.log(`\n=== Sheet: "${sheetName}" ===`);
  console.log(`Total rows: ${rows.length}`);
  console.log('First 5 rows:');
  rows.slice(0, 5).forEach((r, i) => console.log(`  Row ${i}: ${JSON.stringify(r)}`));
  if (rows.length > 5) {
    console.log('Sample row from middle:');
    console.log(`  Row 10: ${JSON.stringify(rows[10])}`);
    console.log(`  Row 20: ${JSON.stringify(rows[20])}`);
  }
});
