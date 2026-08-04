import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const filePath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });

console.log('=== SHEETS ===');
wb.SheetNames.forEach((name, i) => console.log(`${i}: "${name}"`));
console.log('');

wb.SheetNames.forEach(sheetName => {
  console.log(`\n========== SHEET: "${sheetName}" ==========`);
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  console.log(`Range: ${ws['!ref']}`);
  
  // Print first 60 rows
  const limit = Math.min(range.e.r, 59);
  for (let r = range.s.r; r <= limit; r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellAddr];
      row.push(cell ? String(cell.v ?? cell.w ?? '') : '');
    }
    console.log(`R${r + 1}: ${JSON.stringify(row)}`);
  }
  if (range.e.r > 59) {
    console.log(`... (${range.e.r - 59} more rows)`);
  }
});
