import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const wsVeri = wb.Sheets['VERİ'];
const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

// Row 0 is header: ['MÜSTAHSİL', 'TARİH', 'MAL', 'KİLO', 'GİTTİĞİ YER', 'TÜTED', 'ALIŞ FİAT', 'TEDA FİAT', 'HAL TUTAR', 'TEDARİK TUTAR', 'FARK']
// Row 1 is a formula summary row in Excel: [ <8 empty items>, 3905520, 7582891.46, 3677371.46 ]

console.log('Row 1 in VERİ sheet (Excel Summary Row):', rows[1]);

const dataRows = rows.slice(2).filter(r => r[0] && r[1] && r[2] && r[3] !== undefined && r[4]);

let totalHal = 0;
let totalTed = 0;
let totalKg = 0;

const dateBreakdown = {};
const hotelBreakdown = {};

dataRows.forEach(r => {
  const qty = parseFloat(r[3]) || 0;
  const hotel = String(r[4]).trim();
  const buyPrice = parseFloat(r[6]) || 0;
  const supplyPrice = parseFloat(r[7]) || buyPrice;
  const halTutar = parseFloat(r[8]) || (qty * buyPrice);
  const tedTutar = parseFloat(r[9]) || (qty * supplyPrice);

  totalKg += qty;
  totalHal += halTutar;
  totalTed += tedTutar;

  hotelBreakdown[hotel] = (hotelBreakdown[hotel] || 0) + tedTutar;
});

console.log(`\n--- VERİ SAYFASI DETAYLI ANALİZ ---`);
console.log(`Row 1 Excel Formül Rakamı (Column J - TEDARİK TUTAR): ${rows[1][9]}`);
console.log(`Veri Satırlarının Manuel Toplamı (Column J - TEDARİK TUTAR): ₺${totalTed.toFixed(2)}`);
console.log(`Fark (Manuel Toplam vs Row 1 Formül): ₺${(totalTed - rows[1][9]).toFixed(2)}`);

console.log('\n--- OTEL BAZLI TEDARİK TUTARI TOPLAMLARI ---');
let hotelSum = 0;
Object.keys(hotelBreakdown).forEach(h => {
  console.log(`${h}: ₺${hotelBreakdown[h].toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  hotelSum += hotelBreakdown[h];
});
console.log(`Oteller Toplamı: ₺${hotelSum.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
