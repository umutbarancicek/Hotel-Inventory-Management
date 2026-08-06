import fs from 'fs';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

async function syncWithOtelYedek() {
  console.log('=== SYNCING WITH BACKUP FILE (otel yedek.xlsm) ===');
  const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
  const buf = fs.readFileSync(xlsmPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const wsVeri = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

  const dataRows = rows.slice(2).filter(r => r[0] && r[1] && r[2] && r[3] !== undefined && r[4]);

  console.log(`Parsed ${dataRows.length} transaction rows from "VERİ" sheet in otel yedek.xlsm.`);

  const yedekTxs = [];
  dataRows.forEach((r, idx) => {
    const supplier = String(r[0]).trim();
    const isoDate = parseExcelDate(r[1]);
    const prod = String(r[2]).trim();
    const qty = parseFloat(r[3]) || 0;
    const hotel = String(r[4]).trim();
    const buyPrice = parseFloat(r[6]) || 0;
    const supplyPrice = parseFloat(r[7]) || buyPrice;

    if (isoDate && prod && hotel && qty > 0) {
      yedekTxs.push({
        date: isoDate,
        supplier,
        product: prod,
        hotel,
        qty,
        buyPrice,
        supplyPrice
      });
    }
  });

  console.log(`Extracted ${yedekTxs.length} valid transactions from otel yedek.xlsm.`);

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  const dbTxs = [...(data.transactions || [])];

  console.log(`Current DB transactions count: ${dbTxs.length}`);

  let updatedCount = 0;
  let addedCount = 0;

  // Track unmatched items
  const matchedDbIndices = new Set();

  yedekTxs.forEach(yTx => {
    const ySupplier = cleanStr(yTx.supplier);
    const yHotel = cleanStr(yTx.hotel);
    const yProd = cleanStr(yTx.product);

    // Find match in DB
    const dbIndex = dbTxs.findIndex((t, idx) => {
      if (matchedDbIndices.has(idx)) return false;
      return t.date === yTx.date &&
        cleanStr(t.supplier) === ySupplier &&
        cleanStr(t.hotel) === yHotel &&
        cleanStr(t.product) === yProd;
    });

    if (dbIndex !== -1) {
      matchedDbIndices.add(dbIndex);
      // Update existing item
      dbTxs[dbIndex].qty = yTx.qty;
      dbTxs[dbIndex].buyPrice = yTx.buyPrice;
      dbTxs[dbIndex].supplyPrice = yTx.supplyPrice;
      dbTxs[dbIndex].supplier = yTx.supplier;
      dbTxs[dbIndex].product = yTx.product;
      dbTxs[dbIndex].hotel = yTx.hotel;
      updatedCount++;
    } else {
      // Add as new item from backup
      dbTxs.push({
        id: Date.now() + Math.floor(Math.random() * 1000000),
        ...yTx
      });
      addedCount++;
    }
  });

  console.log(`Updated ${updatedCount} existing transactions from otel yedek.xlsm.`);
  console.log(`Added ${addedCount} new transactions present in otel yedek.xlsm.`);
  console.log(`Preserved ${dbTxs.length - updatedCount - addedCount} existing transactions NOT in otel yedek.xlsm (untouched).`);
  console.log(`Final DB transactions count: ${dbTxs.length}`);

  let totalHal = 0;
  let totalTed = 0;
  dbTxs.forEach(t => {
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\n=== UPDATED SYSTEM TOTALS ===`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, {
    transactions: dbTxs
  });

  console.log('✅ Firebase successfully updated with otel yedek.xlsm data!');
}

syncWithOtelYedek().catch(console.error);
