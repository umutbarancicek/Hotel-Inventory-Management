import fs from 'fs';
import * as XLSX from 'xlsx';

const excelPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const excelBuf = fs.readFileSync(excelPath);
const wb = XLSX.read(excelBuf, { type: 'buffer', raw: true });

const sheet = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

const dataRows = rows.slice(1, 1790);

function parseNum(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim();
  if (!str) return 0;
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  return parseFloat(str) || 0;
}

let totalCalculated = 0;
let totalCol5 = 0;
const diffRows = [];

dataRows.forEach((r, idx) => {
  const rowNum = idx + 2; // Excel row number
  const date = r[0];
  const prod = r[1];
  const qty = parseNum(r[3]);
  const buyPrice = parseNum(r[4]);
  const col5Net = parseNum(r[5]);

  const calcTutar = Math.round(qty * buyPrice * 100) / 100;
  const rawTutar = qty * buyPrice;

  totalCalculated += calcTutar;
  totalCol5 += col5Net;

  const diff = col5Net - calcTutar;
  if (Math.abs(diff) > 0.001) {
    diffRows.push({
      excelRow: rowNum,
      date,
      prod,
      qty,
      buyPrice,
      calcTutar,
      col5Net,
      diff
    });
  }
});

console.log(`Total rows checked: ${dataRows.length}`);
console.log(`Sum of Math.round(Qty * Price, 2): ₺${totalCalculated.toLocaleString('tr-TR', {minimumFractionDigits:2})}`);
console.log(`Sum of Col 5 (Net Tutar): ₺${totalCol5.toLocaleString('tr-TR', {minimumFractionDigits:2})}`);
console.log(`Total difference: ₺${(totalCol5 - totalCalculated).toFixed(2)} TL`);

console.log(`\nRows where Col 5 Net Tutar differs from (Qty * Price): ${diffRows.length} rows`);
console.log('Sample differing rows:');
console.table(diffRows.slice(0, 15));
