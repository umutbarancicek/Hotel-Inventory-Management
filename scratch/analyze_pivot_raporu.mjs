import fs from 'fs';
import * as XLSX from 'xlsx';

const filePath = "C:\\Users\\Baran\\Desktop\\pivot_sevk_raporu_2026-08-04 (2).xlsx";

const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', raw: true });
const ws = wb.Sheets['Pivot Raporu'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

console.log(`Total rows (including header): ${rows.length}`);
console.log('Columns:', rows[0]);

// Parse currency string
function parseCurrency(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/[₺\s\.]/g, '').replace(',', '.')) || 0;
}

// Parse date string "DD.MM.YYYY"
function parseDate(val) {
  if (!val) return '';
  const str = String(val).trim();
  const parts = str.split('.');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return `${y}-${m}-${d}`;
  }
  return str;
}

// Parse all data rows
const dataRows = rows.slice(1).filter(r => r[0] && r[1] && r[2] && r[3]);
console.log(`Data rows (non-empty): ${dataRows.length}`);

// Analyze unique suppliers
const suppliers = new Set(dataRows.map(r => r[0]));
console.log('\nUnique suppliers:', [...suppliers]);

// Analyze date range
const dates = dataRows.map(r => parseDate(r[1])).sort();
console.log('Date range:', dates[0], 'to', dates[dates.length - 1]);

// Show sample with parsed values
console.log('\nSample parsed rows (first 10):');
dataRows.slice(0, 10).forEach((r, i) => {
  const supplier = r[0];
  const date = parseDate(r[1]);
  const product = r[2];
  const hotel = r[3];
  const qty = parseFloat(r[4]) || 0;
  const halTutar = parseCurrency(r[5]);
  const tedarikTutar = parseCurrency(r[6]);
  
  const buyPrice = qty > 0 ? Math.round((halTutar / qty) * 100) / 100 : 0;
  const supplyPrice = qty > 0 ? Math.round((tedarikTutar / qty) * 100) / 100 : 0;
  
  console.log(`${i+1}. ${date} | ${supplier} | ${product} -> ${hotel} | ${qty} kg | Hal:₺${halTutar} | Teda:₺${tedarikTutar} | Alış/kg:₺${buyPrice} | Teda/kg:₺${supplyPrice}`);
});

// Check for multiple rows of same product/date/hotel (duplicates that are actually separate deliveries)
console.log('\n=== Checking for same product/date/hotel multi-rows ===');
const keyMap = {};
dataRows.forEach(r => {
  const key = `${r[0]}|${r[1]}|${r[2]}|${r[3]}`;
  if (!keyMap[key]) keyMap[key] = [];
  keyMap[key].push(r);
});
const multiRows = Object.entries(keyMap).filter(([k, v]) => v.length > 1);
console.log(`Groups with >1 row for same supplier/date/product/hotel: ${multiRows.length}`);
if (multiRows.length > 0) {
  multiRows.slice(0, 3).forEach(([key, rows]) => {
    console.log(`\nKey: ${key}`);
    rows.forEach(r => console.log(`  -> qty:${r[4]}, halTutar:${r[5]}, tedarikTutar:${r[6]}`));
  });
}
