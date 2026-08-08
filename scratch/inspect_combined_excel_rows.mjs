import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const wsVeri = wb.Sheets['VERİ'];
const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

function parseExcelDate(val) {
  if (typeof val === 'number') {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (str.includes('.')) {
    const [d, m, y] = str.split('.');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return str;
}

const targetDates = new Set(['2026-05-04', '2026-05-24', '2026-06-24', '2026-05-31', '2026-06-14']);

console.log('Original Excel rows for target dates:');
rows.slice(2).forEach((r, idx) => {
  if (!r[0] || !r[1] || !r[2] || r[3] === undefined || !r[4]) return;
  const date = parseExcelDate(r[1]);
  if (targetDates.has(date)) {
    const product = String(r[2]).trim().toUpperCase();
    const qty = parseFloat(r[3]) || 0;
    const hotel = String(r[4]).trim();
    const buyPrice = parseFloat(r[6]) || 0;
    const supplyPrice = parseFloat(r[7]) || 0;

    // Check if it belongs to one of our combined products
    const prodCheck = ['DOMATES', 'SALATALIK SİLOR PAKET', 'ARMUT SANDAMARİA', 'FESLEĞEN', 'DOMATES ÇERİ'].some(p => product.includes(p));
    if (prodCheck) {
      console.log(`  Row ${idx + 3} | Date: ${date} | Product: "${product}" | Hotel: "${hotel}" | Qty: ${qty} | BuyPrice: ${buyPrice} | SupplyPrice: ${supplyPrice}`);
    }
  }
});
