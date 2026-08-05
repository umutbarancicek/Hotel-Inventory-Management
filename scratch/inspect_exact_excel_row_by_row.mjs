import fs from 'fs';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA1Iv_1fkFSVI-P4Y_g1QlCgB4CMsRZJFI",
  authDomain: "miramor-inventory-management.firebaseapp.com",
  projectId: "miramor-inventory-management",
  storageBucket: "miramor-inventory-management.firebasestorage.app",
  messagingSenderId: "539349013423",
  appId: "1:539349013423:web:53cb425931b51b1530d55a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function parseNumExact(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim();
  if (!str) return 0;
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  return parseFloat(str) || 0;
}

async function inspectTotals() {
  const excelPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
  const excelBuf = fs.readFileSync(excelPath);
  const wb = XLSX.read(excelBuf, { type: 'buffer', raw: true });

  const sheet = wb.Sheets['Sheet'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

  const dataRows = rows.slice(1, 1790); // 1789 data rows

  let sumQtyTimesPrice = 0;
  let sumCol5NetTutar = 0;
  let sumCol6Kdv = 0;
  let sumCol7Toplam = 0;

  dataRows.forEach((r, idx) => {
    const qty = parseNumExact(r[3]);
    const buyPrice = parseNumExact(r[4]);
    const netTutar = parseNumExact(r[5]);
    const kdv = parseNumExact(r[6]);
    const toplam = parseNumExact(r[7]);

    sumQtyTimesPrice += (qty * buyPrice);
    sumCol5NetTutar += netTutar;
    sumCol6Kdv += kdv;
    sumCol7Toplam += toplam;
  });

  console.log('=== EXCEL ROW 1790 (User Toplam Satırı) ===');
  console.log('Row 1790 raw values:', rows[1790]);
  console.log(`Excel Col 3 (Miktar Toplamı): ${rows[1790][3]}`);
  console.log(`Excel Col 5 (Net Tutar Toplamı): ₺${rows[1790][5]}`);
  console.log(`Excel Col 6 (KDV Toplamı): ₺${rows[1790][6]}`);
  console.log(`Excel Col 7 (KDV Dahil Toplam): ₺${rows[1790][7]}`);

  console.log('\n=== EXCEL ROW-BY-ROW CALCULATED SUMS ===');
  console.log(`Sum of (Miktar * Birim Fiyat): ₺${sumQtyTimesPrice.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Sum of Col 5 (Net Tutar): ₺${sumCol5NetTutar.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Sum of Col 6 (KDV): ₺${sumCol6Kdv.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Sum of Col 7 (KDV Dahil Toplam): ₺${sumCol7Toplam.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  console.log('\n=== FIREBASE SITE CURRENT ERTAŞLAR TOTALS ===');
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();
  const txs = data.transactions.filter(t => (t.supplier || '').trim().toUpperCase().includes('ERTAŞ') || (t.supplier || '').trim().toUpperCase().includes('ERTAS'));

  let siteHalTotal = 0;
  let siteTedarikTotal = 0;
  let siteMiktarTotal = 0;

  txs.forEach(t => {
    siteMiktarTotal += t.qty;
    siteHalTotal += (t.qty * t.buyPrice);
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    siteTedarikTotal += (t.qty * eff);
  });

  console.log(`Site Ertaşlar Row Count: ${txs.length}`);
  console.log(`Site Ertaşlar Total Miktar (Kilo/Adet): ${siteMiktarTotal}`);
  console.log(`Site Ertaşlar Total Hal Tutarı (Alış): ₺${siteHalTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Site Ertaşlar Total Tedarik Tutarı: ₺${siteTedarikTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Site Ertaşlar Total Fark (Kar): ₺${(siteTedarikTotal - siteHalTotal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
}

inspectTotals();
