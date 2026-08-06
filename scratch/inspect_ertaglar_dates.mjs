import fs from 'fs';
import * as XLSX from 'xlsx';

const path1 = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026.xlsx";
const buf = fs.readFileSync(path1);
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

function parseExcelDate(val) {
  if (typeof val === 'number') {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val);
}

const dates = [...new Set(rows.slice(1).map(r => parseExcelDate(r[0])))].sort();
console.log('Ertaşlar file dates range:', dates[0], 'to', dates[dates.length - 1]);
console.log('Unique dates count:', dates.length);
console.log('All unique dates:', dates);
