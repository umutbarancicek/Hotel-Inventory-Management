import fs from 'fs';
import * as XLSX from 'xlsx';

const excelPath = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (2).xlsx";
console.log(`Checking file existence: ${fs.existsSync(excelPath)}`);

if (fs.existsSync(excelPath)) {
  const buf = fs.readFileSync(excelPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  console.log('Sheet Names:', wb.SheetNames);

  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`\n--- Sheet "${sheetName}" (${rows.length} rows) ---`);
    console.log('Header Row 0:', rows[0]);
    console.log('Sample Rows 1-5:');
    rows.slice(1, 6).forEach((r, i) => console.log(`Row ${i+1}:`, r));
  });
}
