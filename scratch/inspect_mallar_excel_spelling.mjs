import fs from 'fs';
import * as XLSX from 'xlsx';

const pathMallar = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (2).xlsx";

async function inspectMallarExcel() {
  const buf = fs.readFileSync(pathMallar);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Pivot Raporu'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }).slice(1);

  const suppliers = new Set();
  const hotels = new Set();

  rows.forEach(r => {
    if (r[0]) suppliers.add(r[0]);
    if (r[3]) hotels.add(r[3]);
  });

  console.log('=== UNIQUE SUPPLIERS IN MALLAR EXCEL ===');
  console.log(Array.from(suppliers));

  console.log('=== UNIQUE HOTELS IN MALLAR EXCEL ===');
  console.log(Array.from(hotels));
}

inspectMallarExcel().catch(console.error);
