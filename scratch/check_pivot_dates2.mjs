import fs from 'fs';
import * as XLSX from 'xlsx';

const filePath = "C:\\Users\\Baran\\Desktop\\pivot_sevk_raporu_2026-08-04 (2).xlsx";

// Excel serial date to ISO string
function excelSerialToISO(serial) {
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(val) {
  if (!val) return '';
  if (typeof val === 'number') return excelSerialToISO(val);
  const str = String(val).trim();
  // Handle strings like "46117.00064814815" 
  if (/^\d+\.\d+$/.test(str)) return excelSerialToISO(parseFloat(str));
  const parts = str.split('.');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return `${y}-${m}-${d}`;
  }
  return str;
}

const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', raw: true });
const ws = wb.Sheets['Pivot Raporu'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

// Re-check all unique dates after proper parsing
const allDates = rows.slice(1).filter(r => r[0]).map(r => parseDate(r[1]));
const uniqueDates = [...new Set(allDates)].filter(d => d).sort();
console.log(`All unique dates after proper parsing (${uniqueDates.length} total):`);
uniqueDates.forEach(d => console.log(`  ${d}`));

// Show sample of numeric date conversions
const numericRows = rows.slice(1).filter(r => r[0] && typeof r[1] === 'number' || (r[1] && /^\d+\.\d+$/.test(String(r[1]))));
console.log('\nSample numeric date conversions:');
const uniqueNumericDates = [...new Set(numericRows.map(r => r[1]))];
uniqueNumericDates.slice(0, 10).forEach(val => {
  console.log(`  Raw: ${val} -> ISO: ${parseDate(val)}`);
});
