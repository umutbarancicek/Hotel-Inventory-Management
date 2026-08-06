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
  return String(val);
}

function cleanHotelName(raw) {
  const u = cleanStr(raw);
  if (u.includes('GRAND')) return 'GRAND MİRAMOR';
  if (u.includes('SEAPHORIA') || u.includes('SEPHORIA')) return 'SEAPHORİA';
  if (u.includes('CASAFORA')) return 'CASAFORA';
  if (u.includes('AMBASSADOR')) return 'AMBASSADOR';
  if (u.includes('GARDEN')) return 'MİRAMOR GARDEN';
  if (u.includes('STELLA')) return 'STELLA';
  if (u.includes('ASTORIA')) return 'ASTORİA';
  return u.replace('ANA DEPO', '').trim();
}

function cleanProductName(raw) {
  const u = cleanStr(raw);
  if (u === 'DOMATES CAM' || u === 'DOMATES TARLA') return 'DOMATES';
  if (u === 'KABAK TAZE') return 'KABAK SAKIZ';
  if (u === 'LAHANA BEYAZ') return 'LAHANA';
  return u;
}

async function importErtaglar1ToFirebase() {
  console.log('=== IMPORTING Ertaşlar (1) DATA ON ertaslar2 BRANCH ===');
  const path1 = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
  const buf = fs.readFileSync(path1);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Sheet'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

  const dataRows = rows.slice(1).filter(r => r[0] && r[1] && r[3] > 0 && r[8]);

  console.log(`Parsed ${dataRows.length} valid rows from Ertaşlar (1) file.`);

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  const currentTxs = [...(data.transactions || [])];
  const priceLists = data.priceLists || {};

  console.log(`Current DB Transactions Count before import: ${currentTxs.length}`);

  let addedCount = 0;

  dataRows.forEach((r, idx) => {
    const isoDate = parseExcelDate(r[0]);
    const prod = cleanProductName(r[1]);
    const qty = parseFloat(r[3]) || 0;
    const buyPrice = parseFloat(r[4]) || 0;
    const hotel = cleanHotelName(r[8]);
    const supplier = 'MSD07 TAR ÜR'; // Standard clean supplier name!

    // Look up TÜTED price
    const list = priceLists[isoDate] || [];
    let tutedVal = 0;
    if (list.length > 0) {
      let pMatch = list.find(p => cleanStr(p.product) === prod);
      if (pMatch) {
        let p = (typeof pMatch.price === 'number') ? pMatch.price : parseFloat(String(pMatch.price).replace(/\./g,'').replace(',','.')) || 0;
        if (p > 0 && p < 10 && buyPrice > 20) p = p * 100;
        tutedVal = p;
      }
    }

    const marginRate = (hotel === 'SEAPHORİA' || hotel === 'CASAFORA') ? 0.22 : 0.18;
    let supplyPrice = 0;
    if (tutedVal > 0) {
      supplyPrice = Math.round(tutedVal * marginRate * 100) / 100;
    } else {
      supplyPrice = Math.round(buyPrice * marginRate * 100) / 100;
    }

    // Avoid exact duplicate addition
    const exists = currentTxs.some(t => t.date === isoDate && cleanStr(t.supplier) === supplier && cleanStr(t.hotel) === hotel && cleanStr(t.product) === prod && Math.abs(t.qty - qty) < 0.01);

    if (!exists) {
      currentTxs.push({
        id: 1785995000000 + idx,
        date: isoDate,
        supplier: supplier,
        product: prod,
        hotel: hotel,
        qty: qty,
        buyPrice: buyPrice,
        supplyPrice: supplyPrice
      });
      addedCount++;
    }
  });

  console.log(`Added ${addedCount} new Ertaşlar transactions.`);
  console.log(`Final DB Transactions Count: ${currentTxs.length}`);

  await updateDoc(docRef, {
    transactions: currentTxs
  });

  console.log('✅ Ertaşlar (1) file processed and imported successfully onto ertaslar2 branch!');
}

importErtaglar1ToFirebase().catch(console.error);
