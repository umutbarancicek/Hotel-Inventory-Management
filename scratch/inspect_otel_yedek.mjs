import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
console.log(`Checking file existence: ${fs.existsSync(xlsmPath)}`);

if (fs.existsSync(xlsmPath)) {
  const buf = fs.readFileSync(xlsmPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  console.log('Sheet Names:', wb.SheetNames);

  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`\n--- Sheet "${sheetName}" (${rows.length} rows) ---`);
    console.log('Header Row 0:', rows[0]);
    console.log('Header Row 1:', rows[1]);
    console.log('Sample Rows 2-6:');
    rows.slice(2, 7).forEach((r, i) => console.log(`Row ${i+1}:`, r));
  });
}
