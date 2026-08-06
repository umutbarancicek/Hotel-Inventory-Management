import fs from 'fs';
import * as XLSX from 'xlsx';

const pathExcel = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";

async function inspectExcel() {
  if (!fs.existsSync(pathExcel)) {
    console.error(`File not found: ${pathExcel}`);
    return;
  }

  const buf = fs.readFileSync(pathExcel);
  const wb = XLSX.read(buf, { type: 'buffer' });
  
  console.log('Sheets:', wb.SheetNames);

  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
    console.log(`\n=== SHEET: ${sheetName} (Total Rows: ${rows.length}) ===`);
    console.log('First 5 rows:');
    rows.slice(0, 5).forEach((r, idx) => {
      console.log(`Row ${idx+1}:`, r);
    });
  });
}

inspectExcel().catch(console.error);
