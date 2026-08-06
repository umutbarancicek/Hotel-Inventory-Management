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

function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = String(str).replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

async function addAugust4ErtaslarTxs() {
  console.log('=== ADDING AUGUST 4TH TRANSACTIONS FROM DESKTOP ERTAŞLAR FILE ===');
  const ertPath = "C:\\Users\\Baran\\Desktop\\tüted\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
  if (!fs.existsSync(ertPath)) {
    console.log('Ertaşlar file not found!');
    return;
  }

  const buf = fs.readFileSync(ertPath);
  const wb = XLSX.read(buf, { type: 'buffer' });

  const aug4Txs = [];

  // Parse Ertaşlar 04.08.2026 sheets
  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    // Parse hotel name from sheet name
    let hotelName = 'CASAFORA';
    const sUpper = cleanStr(sheetName);
    if (sUpper.includes('SEAPHORIA') || sUpper.includes('SEPHORIA')) hotelName = 'SEAPHORİA';
    else if (sUpper.includes('AMBASSADOR')) hotelName = 'AMBASSADOR';
    else if (sUpper.includes('MIRAMOR') || sUpper.includes('GRAND')) hotelName = 'GRAND MİRAMOR';

    rows.slice(1).forEach((r, idx) => {
      if (r[0] && r[1] !== undefined) {
        const prod = String(r[0]).trim();
        const qty = parseFloat(r[1]) || 0;
        const buyPrice = parsePrice(r[2]) || 0;

        if (prod && qty > 0) {
          const marginMult = (hotelName === 'SEAPHORİA' || hotelName === 'CASAFORA') ? 0.22 : 0.18;
          // TÜTED 04.08.2026 prices for Havuç Beypazarı = 140 -> 140 * 0.22 = 30.80 TL
          aug4Txs.push({
            id: 1785980000000 + aug4Txs.length,
            date: '2026-08-04',
            supplier: 'MSD07 TAR ÜR',
            product: prod,
            hotel: hotelName,
            qty: qty,
            buyPrice: buyPrice,
            supplyPrice: Math.round(buyPrice * 1.22 * 100) / 100
          });
        }
      }
    });
  });

  console.log(`Parsed ${aug4Txs.length} transactions for 04.08.2026.`);

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  const currentTxs = data.transactions || [];

  // Filter out any previous 04.08 transactions and add fresh 04.08 transactions
  const nonAug4Txs = currentTxs.filter(t => t.date !== '2026-08-04');
  const finalAllTxs = [...nonAug4Txs, ...aug4Txs];

  console.log(`Total transactions now in DB: ${finalAllTxs.length}`);

  await updateDoc(docRef, {
    transactions: finalAllTxs
  });

  console.log('✅ 04.08.2026 transactions added to DB successfully!');
}

addAugust4ErtaslarTxs().catch(console.error);
