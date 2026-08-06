import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const wsVeri = wb.Sheets['VERİ'];
const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

const dataRows = rows.slice(2).filter(r => r[0] && r[1] && r[2] && r[3] !== undefined && r[4]);

console.log(`Total valid data rows: ${dataRows.length}`);
console.log('\n--- LAST 15 ROWS IN VERİ SHEET ---');
let lastRowsSum = 0;
dataRows.slice(-15).forEach((r, idx) => {
  const qty = parseFloat(r[3]) || 0;
  const buyPrice = parseFloat(r[6]) || 0;
  const supplyPrice = parseFloat(r[7]) || buyPrice;
  const tedTutar = parseFloat(r[9]) || (qty * supplyPrice);
  lastRowsSum += tedTutar;
  console.log(`Row ${dataRows.length - 15 + idx + 1}: ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} kg | ${r[4]} | Buy: ₺${r[6]} | Teda: ₺${r[7]} | TedTutar: ₺${tedTutar.toFixed(2)}`);
});

console.log(`\nLast 15 rows total Tedarik Tutarı: ₺${lastRowsSum.toFixed(2)}`);
