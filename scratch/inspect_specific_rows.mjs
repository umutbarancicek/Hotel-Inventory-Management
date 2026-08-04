import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const filePath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = readFileSync(filePath);

const wbRaw = XLSX.read(buf, { type: 'buffer', raw: true });
const rowsRaw = XLSX.utils.sheet_to_json(wbRaw.Sheets['Sheet'], { header: 1, raw: true });

const wbForm = XLSX.read(buf, { type: 'buffer', raw: false });
const rowsForm = XLSX.utils.sheet_to_json(wbForm.Sheets['Sheet'], { header: 1, raw: false });

console.log('=== SEARCHING FOR 14.06.2026 DOMATES ÇERİ ===');
rowsRaw.forEach((r, i) => {
  if (r && r[1] && r[1].toString().includes('DOMATES ÇERİ') && r[3] == 53) {
    console.log(`Line ${i+1}:`);
    console.log('  RAW:', JSON.stringify(r));
    console.log('  FORM:', JSON.stringify(rowsForm[i]));
  }
});

console.log('\n=== SEARCHING FOR 14.06.2026 PATATES 400 KG ===');
rowsRaw.forEach((r, i) => {
  if (r && r[1] && r[1].toString() === 'PATATES' && r[3] == 400) {
    console.log(`Line ${i+1}:`);
    console.log('  RAW:', JSON.stringify(r));
    console.log('  FORM:', JSON.stringify(rowsForm[i]));
  }
});
