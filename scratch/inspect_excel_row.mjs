import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const filePath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = readFileSync(filePath);

// Test 1: raw: false
const wb1 = XLSX.read(buf, { type: 'buffer', raw: false, dateNF: 'DD.MM.YYYY' });
const rows1 = XLSX.utils.sheet_to_json(wb1.Sheets['Sheet'], { header: 1, raw: false });

// Test 2: raw: true
const wb2 = XLSX.read(buf, { type: 'buffer', raw: true });
const rows2 = XLSX.utils.sheet_to_json(wb2.Sheets['Sheet'], { header: 1, raw: true });

console.log('=== ROW 1789/1790 IN EXCEL ===');
console.log('Raw: false row:', rows1[1789]);
console.log('Raw: true row:', rows2[1789]);

// Print all rows where product is MARUL LOLO ROSSO KIRMIZI
console.log('\n=== ALL MARUL LOLO ROSSO KIRMIZI ROWS ===');
rows1.forEach((r, i) => {
  if (r && r[1] && r[1].toString().includes('MARUL LOLO ROSSO KIRMIZI')) {
    console.log(`Line ${i+1}:`, JSON.stringify(r));
    console.log(`  Raw line ${i+1}:`, JSON.stringify(rows2[i]));
  }
});
