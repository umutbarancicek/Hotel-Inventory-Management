import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const filePath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = readFileSync(filePath);

// Use raw: true so XLSX returns exact JavaScript numbers (float)!
const wb = XLSX.read(buf, { type: 'buffer', raw: true });
const sheet = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
const dataRows = rows.slice(1).filter(r => r[0] && r[1] && r[4] !== undefined);

console.log('Total valid data rows:', dataRows.length);

const parseNumCorrect = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = String(val).trim();
  // If string contains comma as decimal e.g. "34,5"
  if (s.includes(',') && !s.includes('.')) {
    return parseFloat(s.replace(',', '.'));
  }
  // If string contains dot as decimal e.g. "34.5"
  if (s.includes('.') && !s.includes(',')) {
    return parseFloat(s);
  }
  // If standard format e.g. "1,035.50" or "1.035,50"
  if (s.includes('.') && s.includes(',')) {
    if (s.indexOf('.') < s.indexOf(',')) {
      // 1.035,50 (European)
      return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    } else {
      // 1,035.50 (US)
      return parseFloat(s.replace(/,/g, ''));
    }
  }
  return parseFloat(s) || 0;
};

// Check for any decimal values in Birim Fiyat (Column index 4) or Miktar (Column index 3)
const decimalRows = [];
dataRows.forEach((r, i) => {
  const miktar = parseNumCorrect(r[3]);
  const birimFiyat = parseNumCorrect(r[4]);
  if (birimFiyat % 1 !== 0 || miktar % 1 !== 0) {
    decimalRows.push({ rowIdx: i + 2, date: r[0], product: r[1], miktar, birimFiyat });
  }
});

console.log(`\nFound ${decimalRows.length} rows with decimal Miktar or Birim Fiyat:`);
decimalRows.slice(0, 15).forEach(r => console.log(`  Row ${r.rowIdx}: ${r.date} | ${r.product} | miktar: ${r.miktar} | birimFiyat: ${r.birimFiyat}`));
