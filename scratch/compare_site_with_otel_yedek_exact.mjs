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

function cleanStr(str) {
  return (str || '').toString().trim().toUpperCase()
    .replace(/İ/g, 'I').replace(/I/g, 'I')
    .replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S').replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C').replace(/\s+/g, ' ');
}

function parseExcelDate(val) {
  if (typeof val === 'number') {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (str.includes('.')) {
    const [d, m, y] = str.split('.');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return str;
}

async function compareSiteWithOtelYedek() {
  const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
  const buf = fs.readFileSync(xlsmPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const wsVeri = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

  const xlsmRows = rows.slice(2).filter(r => r[0] && r[1] && r[2] && r[3] !== undefined && r[4]);

  let xlsmTotalHal = 0;
  let xlsmTotalTed = 0;
  let xlsmTotalKg = 0;

  const xlsmParsed = [];
  xlsmRows.forEach(r => {
    const supplier = String(r[0]).trim();
    const isoDate = parseExcelDate(r[1]);
    const prod = String(r[2]).trim();
    const qty = parseFloat(r[3]) || 0;
    const hotel = String(r[4]).trim();
    const buyPrice = parseFloat(r[6]) || 0;
    const supplyPrice = parseFloat(r[7]) || buyPrice;
    const halTutar = parseFloat(r[8]) || (qty * buyPrice);
    const tedTutar = parseFloat(r[9]) || (qty * supplyPrice);

    xlsmTotalKg += qty;
    xlsmTotalHal += halTutar;
    xlsmTotalTed += tedTutar;

    xlsmParsed.push({
      date: isoDate,
      supplier,
      product: prod,
      hotel,
      qty,
      buyPrice,
      supplyPrice,
      halTutar,
      tedTutar
    });
  });

  console.log(`\n=== EXCEL (otel yedek.xlsm - VERİ SAYFASI TOPLAMLARI) ===`);
  console.log(`Excel Toplam Satır: ${xlsmParsed.length}`);
  console.log(`Excel Toplam Kg: ${xlsmTotalKg.toLocaleString('tr-TR')} kg`);
  console.log(`Excel Hal Maliyeti (Alış): ₺${xlsmTotalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Excel Tedarik Tutarı: ₺${xlsmTotalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Excel Net Fark (Kar): ₺${(xlsmTotalTed - xlsmTotalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  const dbTxs = data.transactions || [];

  let dbTotalHal = 0;
  let dbTotalTed = 0;
  let dbTotalKg = 0;

  dbTxs.forEach(t => {
    dbTotalKg += t.qty;
    dbTotalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    dbTotalTed += t.qty * eff;
  });

  console.log(`\n=== SİTE (FIREBASE SİSTEM TOPLAMLARI) ===`);
  console.log(`Site Toplam Satır: ${dbTxs.length}`);
  console.log(`Site Toplam Kg: ${dbTotalKg.toLocaleString('tr-TR')} kg`);
  console.log(`Site Hal Maliyeti (Alış): ₺${dbTotalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Site Tedarik Tutarı: ₺${dbTotalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Site Net Fark (Kar): ₺${(dbTotalTed - dbTotalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  console.log(`\n=== ARADAKİ FARKLAR (SİTE vs EXCEL) ===`);
  console.log(`Satır Sayısı Farkı: ${dbTxs.length - xlsmParsed.length} satır (Sitede daha fazla satır var)`);
  console.log(`Tedarik Tutarı Farkı: ₺${(dbTotalTed - xlsmTotalTed).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Net Fark (Kar) Farkı: ₺${((dbTotalTed - dbTotalHal) - (xlsmTotalTed - xlsmTotalHal)).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  // Inspect why supply prices differ for matched items
  console.log('\n--- ÖRNEK SATIR KARŞILAŞTIRMALARI (Excel vs Site DB) ---');
  let diffCount = 0;
  xlsmParsed.slice(0, 50).forEach(x => {
    const dbMatch = dbTxs.find(t => t.date === x.date && cleanStr(t.supplier) === cleanStr(x.supplier) && cleanStr(t.hotel) === cleanStr(x.hotel) && cleanStr(t.product) === cleanStr(x.product));
    if (dbMatch) {
      const dbTed = dbMatch.qty * dbMatch.supplyPrice;
      if (Math.abs(dbTed - x.tedTutar) > 0.5) {
        diffCount++;
        if (diffCount <= 10) {
          console.log(`Farklı Satır: ${x.date} | ${x.supplier} | ${x.hotel} | ${x.product} | Qty: ${x.qty}`);
          console.log(`  Excel: Alış ₺${x.buyPrice} | Teda ₺${x.supplyPrice} | TedTutar: ₺${x.tedTutar.toFixed(2)}`);
          console.log(`  Site DB: Alış ₺${dbMatch.buyPrice} | Teda ₺${dbMatch.supplyPrice} | TedTutar: ₺${dbTed.toFixed(2)}`);
        }
      }
    }
  });
}

compareSiteWithOtelYedek().catch(console.error);
