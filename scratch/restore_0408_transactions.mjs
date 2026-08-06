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

async function restore0408Transactions() {
  console.log('=== COMBINING otel yedek.xlsm WITH 04.08.2026 DATA ===');
  const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
  const buf = fs.readFileSync(xlsmPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const wsVeri = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

  const dataRows = rows.slice(2).filter(r => r[0] && r[1] && r[2] && r[3] !== undefined && r[4]);

  const xlsmTxs = [];
  dataRows.forEach((r, idx) => {
    const supplier = String(r[0]).trim();
    const isoDate = parseExcelDate(r[1]);
    const prod = String(r[2]).trim();
    const qty = parseFloat(r[3]) || 0;
    const hotel = String(r[4]).trim();
    const buyPrice = parseFloat(r[6]) || 0;
    const supplyPrice = parseFloat(r[7]) || 0;

    if (isoDate && prod && hotel && qty > 0) {
      xlsmTxs.push({
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

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  const currentTxs = data.transactions || [];

  const laterTxs = currentTxs.filter(t => t.date >= '2026-07-19');
  console.log(`Preserving ${laterTxs.length} transactions dated 19.07.2026 and later (including 04.08.2026).`);

  const finalCombinedTxs = [...xlsmTxs, ...laterTxs];

  console.log(`Final combined transactions count: ${finalCombinedTxs.length}`);

  await updateDoc(docRef, {
    transactions: finalCombinedTxs
  });

  console.log('✅ Firebase successfully updated with combined otel yedek.xlsm and 04.08.2026 data!');
}

restore0408Transactions().catch(console.error);
