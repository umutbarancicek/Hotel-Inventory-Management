import fs from 'fs';
import * as XLSX from 'xlsx';

function parseExcelDate(excelVal) {
  if (!excelVal) return '';
  if (typeof excelVal === 'number') {
    const jsDate = new Date(Math.round((excelVal - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(excelVal);
}

const excelPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const excelBuf = fs.readFileSync(excelPath);
const wb = XLSX.read(excelBuf, { type: 'buffer', raw: true });

const s2Rows = XLSX.utils.sheet_to_json(wb.Sheets['Sayfa1'], { header: 1, raw: true }).slice(1).filter(r => r && r[0] !== undefined);

const dates = {};
const hotels = {};

s2Rows.forEach(r => {
  const date = parseExcelDate(r[0]);
  const hotel = r[12] || 'Bilinmiyor';
  dates[date] = (dates[date] || 0) + 1;
  hotels[hotel] = (hotels[hotel] || 0) + 1;
});

console.log('Sayfa1 Dates:', dates);
console.log('Sayfa1 Hotels:', hotels);
