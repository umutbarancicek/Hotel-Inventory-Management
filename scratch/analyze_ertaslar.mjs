import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const filePath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', raw: false, dateNF: 'DD.MM.YYYY' });

const ws = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'DD.MM.YYYY' });

console.log('HEADER:', JSON.stringify(rows[0]));
console.log('TOTAL DATA ROWS:', rows.length - 1);

const data = rows.slice(1);

// Unique Ana Depo values
const anaDepos = [...new Set(data.map(r => r[8]).filter(Boolean))].sort();
console.log('\n=== ANA DEPO (Otel) Unique Values ===');
anaDepos.forEach(d => console.log(`  "${d}"`));

// Unique products
const products = [...new Set(data.map(r => r[1]).filter(Boolean))].sort();
console.log('\n=== STOK ADI (Ürün) Unique Values ===');
products.forEach(p => console.log(`  "${p}"`));

// Unique dates
const dates = [...new Set(data.map(r => r[0]).filter(Boolean))].sort((a,b) => {
  const [da,ma,ya] = a.split('.');
  const [db,mb,yb] = b.split('.');
  return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
});
console.log('\n=== TARİHLER ===');
dates.forEach(d => console.log(`  "${d}"`));
