import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
if (!fs.existsSync(xlsmPath)) {
  console.error(`Excel file not found at: ${xlsmPath}`);
  process.exit(1);
}

const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });

console.log('All Sheet Names in otel yedek.xlsm:', wb.SheetNames);

wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const rowCount = range.e.r - range.s.r + 1;
  console.log(`Sheet: "${name}" | Row count: ${rowCount}`);
});
