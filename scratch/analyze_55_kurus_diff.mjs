import fs from 'fs';
import * as XLSX from 'xlsx';

const path1 = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = fs.readFileSync(path1);
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

// Column indexes:
// Column D (index 3): Miktar (Qty)
// Column E (index 4): Birim Fiyat (Buy Price)
// Column F (index 5): Net Tutar
// Column H (index 7): Toplam Tutar (Net + Kdv)

let sumExcelColumnF = 0; // Sum of Net Tutar column
let sumExcelColumnH = 0; // Sum of Toplam Tutar column
let sumJsRoundedLineByLine = 0; // Math.round(qty * buyPrice * 100) / 100

rows.slice(1).forEach(r => {
  if (r[3] && r[4]) {
    const qty = parseFloat(r[3]) || 0;
    const buyPrice = parseFloat(r[4]) || 0;
    const netTutar = parseFloat(r[5]) || 0;
    const toplamTutar = parseFloat(r[7]) || 0;

    sumExcelColumnF += netTutar;
    sumExcelColumnH += toplamTutar;
    sumJsRoundedLineByLine += Math.round(qty * buyPrice * 100) / 100;
  }
});

console.log('=== ERTAŞLAR EXCEL SUMMATION ANALYSIS ===');
console.log(`Sum of Excel Net Tutar Column (F): ₺${sumExcelColumnF.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
console.log(`Sum of Excel Toplam Tutar Column (H): ₺${sumExcelColumnH.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
console.log(`Sum of Line-by-Line JS Rounding (Qty * Price): ₺${sumJsRoundedLineByLine.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
console.log(`Difference (Excel Net vs JS Line-by-Line): ₺${(sumExcelColumnF - sumJsRoundedLineByLine).toFixed(2)}`);
