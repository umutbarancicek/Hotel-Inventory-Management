import fs from 'fs';
import * as XLSX from 'xlsx';

const excelPath = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (2).xlsx";
const buf = fs.readFileSync(excelPath);
const wb = XLSX.read(buf, { type: 'buffer', cellDates: false });
const ws = wb.Sheets['Pivot Raporu'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

const dates = rows.slice(1).map(r => r[1]).filter(Boolean);
console.log('Sample raw date strings from Excel:', dates.slice(0, 30));

const formattedIso = dates.map(dStr => {
  const parts = String(dStr).trim().split('.');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return dStr;
});

const uniqueIso = [...new Set(formattedIso)].sort();
console.log('\nUnique ISO dates range:', uniqueIso[0], 'to', uniqueIso[uniqueIso.length - 1]);
console.log('\nAll Unique ISO dates:');
console.log(uniqueIso);
