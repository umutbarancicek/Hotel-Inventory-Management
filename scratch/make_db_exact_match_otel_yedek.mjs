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

async function makeDbExactMatchOtelYedek() {
  console.log('=== MAKING DB 100% EXACT MATCH WITH otel yedek.xlsm ===');
  const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
  const buf = fs.readFileSync(xlsmPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const wsVeri = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

  const xlsmRows = rows.slice(2).filter(r => r[0] && r[1] && r[2] && r[3] !== undefined && r[4]);

  const exactTxs = [];
  xlsmRows.forEach((r, idx) => {
    const supplier = String(r[0]).trim();
    const isoDate = parseExcelDate(r[1]);
    const prod = String(r[2]).trim();
    const qty = parseFloat(r[3]) || 0;
    const hotel = String(r[4]).trim();
    const buyPrice = parseFloat(r[6]) || 0;
    const supplyPrice = parseFloat(r[7]) || buyPrice;

    if (isoDate && prod && hotel && qty > 0) {
      exactTxs.push({
        id: 1785900000000 + idx,
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

  console.log(`Prepared ${exactTxs.length} exact transaction rows from otel yedek.xlsm.`);

  let totalHal = 0;
  let totalTed = 0;
  let totalKg = 0;

  exactTxs.forEach(t => {
    totalKg += t.qty;
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\n=== 100% MATCHED OTEL YEDEK SYSTEM TOTALS ===`);
  console.log(`Total Transactions: ${exactTxs.length}`);
  console.log(`Total Kg: ${totalKg.toLocaleString('tr-TR')} kg`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  const docRef = doc(db, 'storage', 'appData');
  await updateDoc(docRef, {
    transactions: exactTxs
  });

  console.log('✅ Firebase successfully updated to match otel yedek.xlsm 100% exactly!');
}

makeDbExactMatchOtelYedek().catch(console.error);
