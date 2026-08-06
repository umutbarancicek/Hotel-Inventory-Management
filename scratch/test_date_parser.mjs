import fs from 'fs';
import * as XLSX from 'xlsx';

function parseReportDate(val) {
  if (typeof val === 'number') {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();

  // e.g. "24.04.2026"
  if (str.includes('.')) {
    const [d, m, y] = str.split('.');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // e.g. "3/8/26" or "10/7/26" -> D/M/YY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      let d = parts[0].padStart(2, '0');
      let m = parts[1].padStart(2, '0');
      let y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  return str;
}

const excelPath = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (2).xlsx";
const buf = fs.readFileSync(excelPath);
const wb = XLSX.read(buf, { type: 'buffer', cellDates: false });
const ws = wb.Sheets['Pivot Raporu'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

const dates = rows.slice(1).map(r => r[1]).filter(Boolean);
const parsedIsos = dates.map(parseReportDate);

const uniqueIsos = [...new Set(parsedIsos)].sort();
console.log('Unique ISO dates range:', uniqueIsos[0], 'to', uniqueIsos[uniqueIsos.length - 1]);
console.log('Total Unique ISO Dates:', uniqueIsos.length);
console.log(uniqueIsos);
