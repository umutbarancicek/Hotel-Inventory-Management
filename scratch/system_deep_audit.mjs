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

async function deepSystemAudit() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  if (!docSnap.exists()) {
    console.error('AppData doc does not exist!');
    return;
  }

  const data = docSnap.data();
  const txs = data.transactions || [];
  const pms = data.payments || [];
  const accounts = data.accounts || [];
  const priceLists = data.priceLists || {};

  console.log('====================================================');
  console.log('            COMPREHENSIVE SYSTEM AUDIT              ');
  console.log('====================================================\n');

  console.log(`1. DATA TOTALS:`);
  console.log(`- Total Transactions (Sevkiyat Kaydı): ${txs.length}`);
  console.log(`- Total Payments (Ödeme Kaydı): ${pms.length}`);
  console.log(`- Total Accounts (Cari Tanımları): ${accounts.length}`);
  console.log(`- TÜTED Price Archive Dates: ${Object.keys(priceLists).length} farklı tarih`);

  // Financial Overview
  let totalHalMaliyeti = 0;
  let totalTedarikFaturasi = 0;
  let totalKilo = 0;

  const bySupplier = {};
  const byHotel = {};
  const anomalies = [];

  const seenIds = new Set();
  let duplicateIdCount = 0;

  txs.forEach((t, idx) => {
    if (seenIds.has(t.id)) duplicateIdCount++;
    else seenIds.add(t.id);

    const kilo = Number(t.qty) || 0;
    const buyPrice = Number(t.buyPrice) || 0;
    const supplyPrice = Number(t.supplyPrice) || 0;

    if (!t.date) anomalies.push({ row: idx, id: t.id, issue: 'Tarih eksik' });
    if (!t.supplier) anomalies.push({ row: idx, id: t.id, issue: 'Tedarikçi eksik' });
    if (!t.hotel) anomalies.push({ row: idx, id: t.id, issue: 'Otel eksik' });
    if (!t.product) anomalies.push({ row: idx, id: t.id, issue: 'Ürün eksik' });
    if (buyPrice <= 0 && supplyPrice <= 0) anomalies.push({ row: idx, id: t.id, issue: 'Fiyat 0 TL' });

    const hal = kilo * buyPrice;
    const effSupply = supplyPrice > 0 ? supplyPrice : buyPrice;
    const tedarik = kilo * effSupply;

    totalKilo += kilo;
    totalHalMaliyeti += hal;
    totalTedarikFaturasi += tedarik;

    // Supplier stats
    const supName = (t.supplier || 'Bilinmeyen').trim();
    if (!bySupplier[supName]) bySupplier[supName] = { count: 0, kilo: 0, hal: 0, tedarik: 0 };
    bySupplier[supName].count++;
    bySupplier[supName].kilo += kilo;
    bySupplier[supName].hal += hal;
    bySupplier[supName].tedarik += tedarik;

    // Hotel stats
    const hotelName = (t.hotel || 'Bilinmeyen').trim();
    if (!byHotel[hotelName]) byHotel[hotelName] = { count: 0, kilo: 0, hal: 0, tedarik: 0 };
    byHotel[hotelName].count++;
    byHotel[hotelName].kilo += kilo;
    byHotel[hotelName].hal += hal;
    byHotel[hotelName].tedarik += tedarik;
  });

  console.log(`\n2. FINANCIAL SUMMARY:`);
  console.log(`- Toplam Kilo (Sevkiyat): ${totalKilo.toLocaleString('tr-TR')} kg/ad`);
  console.log(`- Toplam Hal Alış Maliyeti: ₺${totalHalMaliyeti.toLocaleString('tr-TR', {minimumFractionDigits:2})}`);
  console.log(`- Toplam Otel Tedarik Faturası: ₺${totalTedarikFaturasi.toLocaleString('tr-TR', {minimumFractionDigits:2})}`);
  console.log(`- Toplam Net Kar / Fark: ₺${(totalTedarikFaturasi - totalHalMaliyeti).toLocaleString('tr-TR', {minimumFractionDigits:2})}`);

  console.log(`\n3. ANOMALY & DATA INTEGRITY REPORT:`);
  console.log(`- Mükerrer ID Sayısı: ${duplicateIdCount}`);
  console.log(`- Anomali / Eksik Verili Kayıt Sayısı: ${anomalies.length}`);
  if (anomalies.length > 0) {
    console.log('  Anomali örnekleri:', anomalies.slice(0, 10));
  }

  console.log(`\n4. BREAKDOWN BY SUPPLIER (TEDARİKÇİLER):`);
  Object.entries(bySupplier).forEach(([name, s]) => {
    const fark = s.tedarik - s.hal;
    console.log(`• ${name.padEnd(22)}: ${String(s.count).padStart(4)} kayıt | ${s.kilo.toLocaleString('tr-TR').padStart(9)} kg | Alış: ₺${s.hal.toLocaleString('tr-TR', {minimumFractionDigits:2}).padStart(14)} | Tedarik: ₺${s.tedarik.toLocaleString('tr-TR', {minimumFractionDigits:2}).padStart(14)} | Fark: ₺${fark.toLocaleString('tr-TR', {minimumFractionDigits:2}).padStart(12)}`);
  });

  console.log(`\n5. BREAKDOWN BY HOTEL (OTELLER):`);
  Object.entries(byHotel).forEach(([name, h]) => {
    const fark = h.tedarik - h.hal;
    console.log(`• ${name.padEnd(22)}: ${String(h.count).padStart(4)} kayıt | ${h.kilo.toLocaleString('tr-TR').padStart(9)} kg | Alış: ₺${h.hal.toLocaleString('tr-TR', {minimumFractionDigits:2}).padStart(14)} | Tedarik: ₺${h.tedarik.toLocaleString('tr-TR', {minimumFractionDigits:2}).padStart(14)} | Fark: ₺${fark.toLocaleString('tr-TR', {minimumFractionDigits:2}).padStart(12)}`);
  });

  console.log(`\n6. PAYMENTS SUMMARY:`);
  let totalPaymentsAmount = 0;
  const paymentsByAccount = {};
  pms.forEach(p => {
    totalPaymentsAmount += p.amount;
    const acc = (p.account || 'Bilinmiyor').trim();
    paymentsByAccount[acc] = (paymentsByAccount[acc] || 0) + p.amount;
  });
  console.log(`- Toplam Ödeme Kaydı Sayısı: ${pms.length}`);
  console.log(`- Toplam Ödenen Tutar: ₺${totalPaymentsAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})}`);
  console.log('Ödemeler cari dağılımı:', paymentsByAccount);

  console.log(`\n7. TÜTED PRICE LISTS ARCHIVE:`);
  const priceDates = Object.keys(priceLists).sort();
  console.log(`- Arşivdeki Tarih Aralığı: ${priceDates[0]} ile ${priceDates[priceDates.length - 1]} arası`);
  console.log(`- Arşivdeki Tarihler (${priceDates.length} adet):`, priceDates);
}

deepSystemAudit();
