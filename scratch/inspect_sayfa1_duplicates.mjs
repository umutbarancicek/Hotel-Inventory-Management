import fs from 'fs';
import * as XLSX from 'xlsx';

const pathExcel = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";

async function inspectSayfa1() {
  const buf = fs.readFileSync(pathExcel);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Sayfa1'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

  console.log('Sayfa1 rows containing MAYDANOZ on 2026-04-30 (date code 46142):');
  rows.forEach((r, idx) => {
    if (r[0] === 46142 && r[5] === 'MAYDANOZ') {
      console.log(`Row ${idx+1}:`, r);
    }
  });
}

inspectSayfa1().catch(console.error);
