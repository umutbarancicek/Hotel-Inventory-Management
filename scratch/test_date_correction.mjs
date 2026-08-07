import fs from 'fs';
import * as XLSX from 'xlsx';

const filePath = "C:\\Users\\Baran\\Desktop\\pivot_sevk_raporu_2026-08-04 (2).xlsx";

// Excel serial date to ISO (this gives us DD=day, MM=month FROM EXCEL)
// BUT Excel often stores as MM/DD internally for some locales, or formats differ.
// The issue here: serial dates like 46117 are being read as "05.04.2026" (April 5)
// but should be "04.05.2026" (May 4).
// This is a day/month swap in the Excel serial number interpretation.

function excelSerialToISO_raw(serial) {
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// For serial dates: swap day and month in final ISO to fix the bug
function excelSerialToISO_corrected(serial) {
  const raw = excelSerialToISO_raw(serial);
  const [y, m, d] = raw.split('-');
  // Swap month and day
  return `${y}-${d}-${m}`;
}

function parseDate(val) {
  if (!val) return '';
  if (typeof val === 'number') return excelSerialToISO_corrected(val);
  const str = String(val).trim();
  if (/^\d+\.\d+$/.test(str)) return excelSerialToISO_corrected(parseFloat(str));
  const parts = str.split('.');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return `${y}-${m}-${d}`;
  }
  return str;
}

function parseCurrency(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/[₺\s\.]/g, '').replace(',', '.')) || 0;
}

const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', raw: true });
const ws = wb.Sheets['Pivot Raporu'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

// Re-check date groups with corrected parsing
const dataRows = rows.slice(1).filter(r => r[0]);
const dateGroups = [];
let currentDate = '';
dataRows.forEach(r => {
  const rawDate = parseDate(r[1]);
  if (rawDate !== currentDate) {
    currentDate = rawDate;
    dateGroups.push({ rawDate, val: r[1], sample: `${r[0]} | ${r[2]} -> ${r[3]}` });
  }
});

console.log('All dates in order (with corrected serial parsing):');
dateGroups.forEach((g, i) => {
  const typeLabel = (typeof g.val === 'number' || /^\d+\.\d+$/.test(String(g.val))) ? '[SERIAL]' : '[STRING]';
  console.log(`  ${String(i+1).padStart(2)}. ${typeLabel} Raw: "${g.val}" -> Corrected: ${g.rawDate} | ${g.sample}`);
});

// Check if still any out-of-order dates remain
console.log('\n\nChecking chronological order after correction:');
let prevDate = '2026-01-01';
let allGood = true;
dateGroups.filter(g => g.rawDate).forEach((g, i) => {
  if (g.rawDate < prevDate) {
    console.log(`  ❌ Out of order at position ${i+1}: ${g.rawDate} after ${prevDate} | ${g.sample}`);
    allGood = false;
  } else {
    prevDate = g.rawDate;
  }
});
if (allGood) console.log('  ✅ All dates are in chronological order!');

// Print all unique dates
const allDates = dataRows.map(r => parseDate(r[1])).filter(d => d && d !== '');
const uniqueDates = [...new Set(allDates)].sort();
console.log('\nUnique dates:', uniqueDates);
