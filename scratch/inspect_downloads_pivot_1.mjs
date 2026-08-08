import fs from 'fs';
import * as XLSX from 'xlsx';

const pathMallar = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (1).xlsx";
if (!fs.existsSync(pathMallar)) {
  console.error(`Excel file not found at: ${pathMallar}`);
  process.exit(1);
}

const buf = fs.readFileSync(pathMallar);
const wb = XLSX.read(buf, { type: 'buffer' });

console.log('All Sheet Names in pivot_sevk_raporu_2026-08-04 (1).xlsx:', wb.SheetNames);

wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const rowCount = range.e.r - range.s.r + 1;
  console.log(`Sheet: "${name}" | Row count: ${rowCount}`);
});
