import fs from 'fs';
import * as XLSX from 'xlsx';

const path1 = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = fs.readFileSync(path1);
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
  return String(val);
}

const diffRows = [];

rows.slice(1).forEach((r, idx) => {
  if (r[3] && r[4]) {
    const dateStr = parseExcelDate(r[0]);
    const prod = String(r[1]).trim();
    const qty = parseFloat(r[3]) || 0;
    const rawPrice = parseFloat(r[4]) || 0;
    const excelNet = parseFloat(r[5]) || 0;
    const hotel = String(r[8] || '').trim();

    // Actual buy price in TL
    const buyPriceTL = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
    const jsRounded = Math.round(qty * buyPriceTL * 100) / 100;
    const diff = Math.round((excelNet - jsRounded) * 100) / 100;

    if (Math.abs(diff) > 0.001) {
      diffRows.push({
        excelRow: idx + 2,
        date: dateStr,
        hotel,
        prod,
        qty,
        buyPriceTL,
        excelNet,
        jsRounded,
        diff
      });
    }
  }
});

console.log(`Found ${diffRows.length} rows with rounding discrepancy:`);
diffRows.slice(0, 15).forEach((dr, i) => {
  console.log(`${i+1}. Excel Row ${dr.excelRow} | ${dr.date} | ${dr.hotel} | ${dr.prod} | Qty: ${dr.qty} | Price: ₺${dr.buyPriceTL} | Excel Net: ₺${dr.excelNet} | JS Rounded: ₺${dr.jsRounded} | Diff: ${dr.diff > 0 ? '+' : ''}${dr.diff} TL`);
});
