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
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

// Convert any raw numeric price to 10x TÜTED format expected by main.js (e.g. 45 TL -> 450.00)
function to10xTutedFormat(rawPrice) {
  let val = parsePrice(rawPrice);
  if (val <= 0) return '0.00';

  // If val is real TL (e.g. 45.00), scale up to 10x (450.00)
  if (val < 250.0) {
    val = val * 10;
  }
  // If val was 100x or 1000x (e.g. > 2500.00), scale down to 10x
  while (val > 2500.0) {
    val = val / 10;
  }
  return val.toFixed(2);
}

async function fixPriceListsTo10x() {
  console.log('=== CONVERTING ALL PRICELISTS TO STANDARD 10X TÜTED FORMAT ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const transactions = data.transactions || [];

  let fixedCount = 0;
  Object.keys(priceLists).forEach(d => {
    (priceLists[d] || []).forEach(item => {
      const newP = to10xTutedFormat(item.price);
      item.price = newP;
      fixedCount++;
    });
  });

  console.log(`Converted ${fixedCount} items across all dates in priceLists.`);

  console.log('27.07.2026 BİBER KALİFORNİYA in priceLists:');
  const list27 = priceLists['2026-07-27'] || [];
  const biber27 = list27.find(p => p.product.includes('KALİFORNİYA'));
  console.log(biber27);

  console.log('\n=== RECALCULATING ALL TRANSACTIONS SUPPLY PRICES WITH MAIN.JS LOGIC ===');
  transactions.forEach(tx => {
    const isSpecialHotel = (tx.hotel || '').toUpperCase().includes('SEPHORIA') || 
                           (tx.hotel || '').toUpperCase().includes('SEAPHORİA') || 
                           (tx.hotel || '').toUpperCase().includes('CASAFORA');
    const marginRate = isSpecialHotel ? 0.22 : 0.18;

    const list = priceLists[tx.date] || [];
    const txProd = cleanStr(tx.product);

    let tutedVal = 0;
    if (list.length > 0) {
      let pMatch = list.find(p => cleanStr(p.product) === txProd);
      if (!pMatch) {
        pMatch = list.find(p => {
          const pName = cleanStr(p.product);
          return pName.includes(txProd) || txProd.includes(pName);
        });
      }
      if (pMatch) tutedVal = parsePrice(pMatch.price);
    }

    if (tutedVal > 0) {
      tx.supplyPrice = Math.round(tutedVal * marginRate * 100) / 100;
    } else {
      tx.supplyPrice = tx.buyPrice;
    }
  });

  let totalHal = 0;
  let totalTed = 0;

  transactions.forEach(t => {
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\nFinal Correct System Totals:`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, {
    priceLists: priceLists,
    transactions: transactions
  });

  console.log('✅ Firebase successfully updated with exact 10x TÜTED prices!');
}

fixPriceListsTo10x().catch(console.error);
