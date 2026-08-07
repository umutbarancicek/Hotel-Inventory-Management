import fs from 'fs';
import * as XLSX from 'xlsx';

const filePath = "C:\\Users\\Baran\\Desktop\\pivot_sevk_raporu_2026-08-04 (2).xlsx";

const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', raw: true });
const ws = wb.Sheets['Pivot Raporu'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

// Find rows with bad date values (Excel serial numbers instead of strings)
const badDateRows = rows.slice(1).filter(r => {
  const dateVal = r[1];
  if (!dateVal) return false;
  const str = String(dateVal);
  // If it's a number or a non-DD.MM.YYYY string, it's bad
  if (typeof dateVal === 'number') return true;
  if (!str.includes('.') && !str.includes('-') && !str.includes('/')) return true;
  return false;
});

console.log(`Rows with bad/numeric date values: ${badDateRows.length}`);
badDateRows.slice(0, 20).forEach((r, i) => {
  console.log(`  ${i+1}. Raw date: "${r[1]}" | Supplier: ${r[0]} | Product: ${r[2]} | Hotel: ${r[3]}`);
});

// Date range analysis
function parseDate(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel serial date
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
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

const allDates = rows.slice(1).filter(r => r[0]).map(r => parseDate(r[1]));
const uniqueDates = [...new Set(allDates)].sort();
console.log(`\nAll unique dates (${uniqueDates.length} total):`);
uniqueDates.forEach(d => console.log(`  ${d}`));
