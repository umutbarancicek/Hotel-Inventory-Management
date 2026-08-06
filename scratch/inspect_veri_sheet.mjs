import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });

const wsVeri = wb.Sheets['VERİ'];
if (wsVeri) {
  const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1 });
  console.log(`\n--- Sheet "VERİ" (${rows.length} rows) ---`);
  console.log('Row 0 (Header?):', rows[0]);
  console.log('Row 1:', rows[1]);
  console.log('Sample Rows 2-10:');
  rows.slice(2, 11).forEach((r, i) => console.log(`Row ${i+1}:`, r));
}
