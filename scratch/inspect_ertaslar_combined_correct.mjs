import fs from 'fs';
import * as XLSX from 'xlsx';

const pathErtaslar = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026.xlsx";
const buf = fs.readFileSync(pathErtaslar);
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

function parseExcelDate(val) {
  if (typeof val === 'number') {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).trim();
}

console.log('Correctly searching Ertaşlar Excel rows for Fesleğen on 2026-05-31 and Domates Çeri on 2026-06-14:');
rows.slice(1).forEach((r, idx) => {
  if (!r[0] || !r[5] || r[7] === undefined) return;
  const date = parseExcelDate(r[0]);
  const product = String(r[5]).trim().toUpperCase();
  if ((date === '2026-05-31' && product.includes('FESLEĞEN')) || (date === '2026-06-14' && product.includes('ÇERİ'))) {
    console.log(`  Row ${idx + 2} | Date: ${date} | Product: "${r[5]}" | Qty: ${r[7]} | Price: ${r[8]} | Hotel: ${r[12]}`);
  }
});
