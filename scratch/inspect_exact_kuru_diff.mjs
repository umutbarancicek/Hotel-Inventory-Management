import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const wsVeri = wb.Sheets['VERİ'];
const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

const xlsmRows = rows.slice(2).filter(r => r[0] && r[1] && r[2] && r[3] !== undefined && r[4]);

let sumColJ = 0; // Column 9: TEDARİK TUTAR in Excel
let sumCalc = 0; // KİLO * TEDA FİAT
let sumHal = 0;  // Column 8: HAL TUTAR in Excel

xlsmRows.forEach(r => {
  const qty = parseFloat(r[3]) || 0;
  const buyPrice = parseFloat(r[6]) || 0;
  const tedaFiat = parseFloat(r[7]) || buyPrice;
  const halTutar = parseFloat(r[8]) || (qty * buyPrice);
  const tedTutar = parseFloat(r[9]) || (qty * tedaFiat);

  sumHal += halTutar;
  sumColJ += tedTutar;
  sumCalc += qty * tedaFiat;
});

console.log(`Excel VERİ Sayfası Satır Sayısı: ${xlsmRows.length}`);
console.log(`Excel HAL TUTARI Toplamı: ₺${sumHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
console.log(`Excel Column J (TEDARİK TUTAR) Toplamı: ₺${sumColJ.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
console.log(`Excel (KİLO x TEDA FİAT) Toplamı: ₺${sumCalc.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
