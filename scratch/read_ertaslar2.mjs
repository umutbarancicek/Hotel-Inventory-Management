import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const filePath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });

// Show header row and first 5 data rows for each sheet
wb.SheetNames.forEach(sheetName => {
  console.log(`\n========== SHEET: "${sheetName}" ==========`);
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'YYYY-MM-DD' });
  
  // Print header
  console.log('HEADER:', JSON.stringify(rows[0]));
  console.log('TOTAL ROWS:', rows.length - 1, 'data rows');
  
  // Print first 5 data rows
  for (let i = 1; i <= Math.min(5, rows.length - 1); i++) {
    console.log(`Row ${i}:`, JSON.stringify(rows[i]));
  }
  
  // Show unique hotels and dates
  const hotels = [...new Set(rows.slice(1).map(r => r[12]).filter(Boolean))];
  const dates = [...new Set(rows.slice(1).map(r => r[0]).filter(Boolean))].sort();
  console.log('\nUnique HOTELS:', hotels);
  console.log('Unique DATES:', dates);
});
