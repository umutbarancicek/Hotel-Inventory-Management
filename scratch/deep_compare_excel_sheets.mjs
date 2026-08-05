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

function parseExcelDate(excelVal) {
  if (!excelVal) return '';
  if (typeof excelVal === 'number') {
    const jsDate = new Date(Math.round((excelVal - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(excelVal).trim();
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${String(parts[1]).padStart(2,'0')}-${String(parts[0]).padStart(2,'0')}`;
    }
  }
  return str;
}

async function deepCompare() {
  const excelPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
  const excelBuf = fs.readFileSync(excelPath);
  const wb = XLSX.read(excelBuf, { type: 'buffer', raw: true });

  console.log('=== EXCEL SHEET 1: "Sheet" (1789 data rows) ===');
  const s1Rows = XLSX.utils.sheet_to_json(wb.Sheets['Sheet'], { header: 1, raw: true }).slice(1).filter(r => r && r[0] !== undefined);
  
  let s1NetTutarSum = 0;
  let s1KdvSum = 0;
  let s1ToplamKdvliSum = 0;
  let s1QtyBuySum = 0;
  const s1Caris = {};

  s1Rows.forEach(r => {
    const qty = parseNumExact(r[3]);
    const buyPrice = parseNumExact(r[4]);
    const netTutar = parseNumExact(r[5]);
    const kdv = parseNumExact(r[6]);
    const toplamKdvli = parseNumExact(r[7]);
    const cari = String(r[9] || 'Ertaşlar').trim();

    s1QtyBuySum += (qty * buyPrice);
    s1NetTutarSum += netTutar;
    s1KdvSum += kdv;
    s1ToplamKdvliSum += toplamKdvli;

    s1Caris[cari] = (s1Caris[cari] || 0) + 1;
  });

  console.log(`Sheet "Sheet" Row Count: ${s1Rows.length}`);
  console.log(`Sheet "Sheet" ∑(Qty * BuyPrice): ₺${s1QtyBuySum.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Sheet "Sheet" Net Tutar Sum (Col 5): ₺${s1NetTutarSum.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Sheet "Sheet" KDV Sum (Col 6): ₺${s1KdvSum.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Sheet "Sheet" Toplam (KDV'li) Sum (Col 7): ₺${s1ToplamKdvliSum.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log('Sheet "Sheet" Caris:', s1Caris);


  console.log('\n=== EXCEL SHEET 2: "Sayfa1" (157 data rows) ===');
  const s2Rows = XLSX.utils.sheet_to_json(wb.Sheets['Sayfa1'], { header: 1, raw: true }).slice(1).filter(r => r && r[0] !== undefined);
  
  let s2NetTutarSum = 0;
  let s2KdvSum = 0;
  let s2ToplamKdvliSum = 0;
  let s2QtyBuySum = 0;
  const s2Caris = {};

  s2Rows.forEach(r => {
    // Sayfa1 headers: Tarih(0), Fatura No(1), Fis No(2), Fis Tipi(3), Stok Kodu(4), Stok Adı(5), Birim(6), Miktar(7), Birim Fiyat(8), Net Tutar(9), Kdv(10), Toplam(11), Ana Depo(12), Cari Adı(13)
    const qty = parseNumExact(r[7]);
    const buyPrice = parseNumExact(r[8]);
    const netTutar = parseNumExact(r[9]);
    const kdv = parseNumExact(r[10]);
    const toplamKdvli = parseNumExact(r[11]);
    const cari = String(r[13] || 'Bilinmiyor').trim();

    s2QtyBuySum += (qty * buyPrice);
    s2NetTutarSum += netTutar;
    s2KdvSum += kdv;
    s2ToplamKdvliSum += toplamKdvli;

    s2Caris[cari] = (s2Caris[cari] || 0) + 1;
  });

  console.log(`Sheet "Sayfa1" Row Count: ${s2Rows.length}`);
  console.log(`Sheet "Sayfa1" ∑(Qty * BuyPrice): ₺${s2QtyBuySum.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Sheet "Sayfa1" Net Tutar Sum (Col 9): ₺${s2NetTutarSum.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Sheet "Sayfa1" KDV Sum (Col 10): ₺${s2KdvSum.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Sheet "Sayfa1" Toplam (KDV'li) Sum (Col 11): ₺${s2ToplamKdvliSum.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log('Sheet "Sayfa1" Caris:', s2Caris);

  console.log('\n=== FIREBASE SITE DATA ===');
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const fbData = docSnap.data();
  const siteTxs = fbData.transactions || [];

  console.log(`Total transactions on site: ${siteTxs.length}`);

  const bySupplier = {};
  siteTxs.forEach(t => {
    const s = (t.supplier || 'Bilinmiyor').trim();
    if (!bySupplier[s]) bySupplier[s] = { count: 0, halTotal: 0, tedarikTotal: 0 };
    const hal = t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    const ted = t.qty * eff;

    bySupplier[s].count++;
    bySupplier[s].halTotal += hal;
    bySupplier[s].tedarikTotal += ted;
  });

  console.log('Site breakdown by supplier:');
  Object.entries(bySupplier).forEach(([sup, stats]) => {
    console.log(`• ${sup}: ${stats.count} kayıt | Hal Tutarı (Net Alış): ₺${stats.halTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})} | Tedarik Tutarı: ₺${stats.tedarikTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}`);
  });
}

deepCompare();
