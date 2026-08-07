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

// USER CONFIRMED: Day-Month swapped dates. 
// "05.04.2026" from serial 46117 actually means "04.05.2026" (4 May)
// "05.11.2026" from serial 46331 actually means "11.05.2026" (11 May)
// 
// The rule: when a numeric serial date produces a date that doesn't fit chronologically
// after the previous text date, we need to SWAP day and month.
//
// Strategy: parse raw, detect swaps by looking at outliers, then apply swap correction.

function swapDayMonth(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${y}-${d}-${m}`;
}

const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', raw: true });
const ws = wb.Sheets['Pivot Raporu'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

// Parse all rows
const dataRows = rows.slice(1).filter(r => r[0]);

// Show all unique dates in order
const dateGroups = [];
let currentDate = '';
dataRows.forEach(r => {
  const rawDate = parseDate(r[1]);
  if (rawDate !== currentDate) {
    currentDate = rawDate;
    dateGroups.push({ rawDate, val: r[1], sample: `${r[0]} | ${r[2]} -> ${r[3]}` });
  }
});

console.log('Dates in order of appearance:');
dateGroups.forEach((g, i) => {
  console.log(`  ${i+1}. Raw: "${g.val}" -> Parsed: ${g.rawDate} | ${g.sample}`);
});

// Detect outliers: if parsed date is BEFORE the previous date and the parsed date looks like
// day and month might be swapped to make it valid
console.log('\n\nDetecting swapped dates:');
let prevDate = '2026-01-01';
dateGroups.forEach((g, i) => {
  const parsed = g.rawDate;
  if (parsed < prevDate) {
    const swapped = swapDayMonth(parsed);
    console.log(`  Outlier: ${parsed} comes after ${prevDate}. Swapped: ${swapped}`);
  } else {
    prevDate = parsed;
  }
});
