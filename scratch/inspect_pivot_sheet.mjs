import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const wsPivot = wb.Sheets['PİVOT'];
if (wsPivot) {
  const rows = XLSX.utils.sheet_to_json(wsPivot, { header: 1 });
  console.log(`\n--- Sheet "PİVOT" (${rows.length} rows) ---`);
  rows.forEach((r, i) => console.log(`Row ${i}:`, r));
}
