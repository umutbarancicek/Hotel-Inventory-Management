import fs from 'fs';
import * as XLSX from 'xlsx';

const filePath = "C:\\Users\\Baran\\Desktop\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";

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
  if (/^\d+$/.test(str)) return excelSerialToISO(parseInt(str));
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

// Use "Sheet" tab
const ws = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

const uniqueDates = [...new Set(rows.slice(1).filter(r => r[0]).map(r => parseDate(r[0])))].sort();
console.log(`Total rows: ${rows.length}`);
console.log(`Unique dates (${uniqueDates.length}):`);
uniqueDates.forEach(d => console.log(`  ${d}`));

// Unique hotels
const uniqueHotels = [...new Set(rows.slice(1).filter(r => r[8]).map(r => r[8]))];
console.log('\nUnique hotels/depots:');
uniqueHotels.forEach(h => console.log(`  "${h}"`));
