/**
 * AUDIT DATABASE VS EXCEL (otel yedek.xlsm) ROW-BY-ROW
 * 
 * Find any mismatches, missing rows, or combined rows between the database and the Excel.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import * as XLSX from 'xlsx';

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

async function main() {
  const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
  if (!fs.existsSync(xlsmPath)) {
    console.error(`Excel file not found at: ${xlsmPath}`);
    return;
  }

  console.log(`Reading Excel: ${xlsmPath}...`);
  const buf = fs.readFileSync(xlsmPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const wsVeri = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

  // Columns in VERİ sheet (starting from row index 2, which is row 3 in Excel):
  // Col 0: Supplier
  // Col 1: Date
  // Col 2: Product
  // Col 3: Qty (Kilo)
  // Col 4: Hotel (Gittiği Yer)
  // Col 6: BuyPrice (Alış)
  // Col 7: SupplyPrice (Teda)
  // We ignore rows with empty or 0 quantity
  const excelTxs = [];
  rows.slice(2).forEach((r, idx) => {
    if (!r[0] || !r[1] || !r[2] || r[3] === undefined || !r[4]) return;
    const qty = parseFloat(r[3]) || 0;
    if (qty === 0) return; // Skip 0 quantity lines

    const date = parseExcelDate(r[1]);
    const supplier = String(r[0]).trim();
    const product = String(r[2]).trim().toUpperCase();
    const hotel = String(r[4]).trim();
    const buyPrice = parseFloat(r[6]) || 0;
    const supplyPrice = parseFloat(r[7]) || 0;

    excelTxs.push({
      excelRowIndex: idx + 3,
      date,
      supplier,
      product,
      hotel,
      qty,
      buyPrice,
      supplyPrice
    });
  });

  console.log(`Loaded ${excelTxs.length} valid transactions from Excel.`);

  // Load Firestore transactions
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const dbTxs = docSnap.data().transactions || [];
  console.log(`Loaded ${dbTxs.length} transactions from Firestore.`);

  // Let's match them!
  // To avoid ordering issues, we will build a match helper
  const dbMatched = new Set();
  const excelMatched = new Set();

  const mismatches = [];

  // Match logic:
  // For each excel transaction, find a matching database transaction
  // A match requires matching date, supplier, product, hotel, and qty (allowing minor float difference)
  excelTxs.forEach((et, eIdx) => {
    const dbIndex = dbTxs.findIndex((dt, dIdx) => {
      if (dbMatched.has(dIdx)) return false;
      if (dt.date !== et.date) return false;
      if ((dt.supplier || '').trim().toUpperCase() !== et.supplier.toUpperCase()) return false;
      if ((dt.product || '').trim().toUpperCase() !== et.product) return false;
      if ((dt.hotel || '').trim().toUpperCase() !== et.hotel.toUpperCase()) return false;
      
      // Allow minor float variance in qty
      const qtyDiff = Math.abs(parseFloat(dt.qty) - et.qty);
      if (qtyDiff > 0.05) return false;

      return true;
    });

    if (dbIndex !== -1) {
      dbMatched.add(dbIndex);
      excelMatched.add(eIdx);
    } else {
      mismatches.push({ type: 'missing_in_db', excelTx: et });
    }
  });

  // Find DB transactions not matched to any Excel transaction
  const extraInDb = [];
  dbTxs.forEach((dt, dIdx) => {
    if (!dbMatched.has(dIdx)) {
      extraInDb.push({ dbIdx: dIdx, dbTx: dt });
    }
  });

  console.log(`\n--- Match Summary ---`);
  console.log(`Matched rows: ${dbMatched.size}`);
  console.log(`Missing in DB (found in Excel but not matched in DB): ${mismatches.length}`);
  console.log(`Extra in DB (found in DB but not matched in Excel): ${extraInDb.length}`);

  if (mismatches.length > 0) {
    console.log(`\n--- Samples Missing in DB (first 20) ---`);
    mismatches.slice(0, 20).forEach(m => {
      const e = m.excelTx;
      console.log(`  Row ${e.excelRowIndex} | Date: ${e.date} | Product: ${e.product} | Hotel: ${e.hotel} | Qty: ${e.qty} | Buy: ${e.buyPrice} | Supply: ${e.supplyPrice}`);
    });
  }

  if (extraInDb.length > 0) {
    console.log(`\n--- Samples Extra/Merged in DB (first 20) ---`);
    extraInDb.slice(0, 20).forEach(m => {
      const d = m.dbTx;
      console.log(`  Date: ${d.date} | Product: ${d.product} | Hotel: ${d.hotel} | Qty: ${d.qty} | Buy: ${d.buyPrice} | Supply: ${d.supplyPrice}`);
    });
  }
}

main().catch(console.error);
