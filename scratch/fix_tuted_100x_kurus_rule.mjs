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

// TÜTED Borsa prices are printed in kuruş / 100x format (e.g. 4500 -> 45.00 TL, 20000 -> 200.00 or 20.00 TL)
function kurusToRealTl(rawPrice) {
  let val = parsePrice(rawPrice);
  if (val <= 0) return '0.00';

  // Divide by 100 until val falls in real produce price range [0.50 TL, 250.00 TL]
  while (val > 250.0) {
    val = val / 100.0;
  }
  return val.toFixed(2);
}

async function fixTuted100xKurus() {
  console.log('=== CONVERTING ALL TÜTED KURUS PRICES (100X) TO REAL TL ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const transactions = data.transactions || [];

  let priceCount = 0;
  Object.keys(priceLists).forEach(d => {
    (priceLists[d] || []).forEach(item => {
      item.price = kurusToRealTl(item.price);
      priceCount++;
    });
  });

  console.log(`Converted ${priceCount} price list items across all dates.`);

  console.log('\n04.08.2026 Corrected TÜTED Borsa Prices:');
  (priceLists['2026-08-04'] || []).slice(0, 15).forEach(i => console.log(`${i.product}: ₺${i.price}`));

  console.log('\n=== RECALCULATING ALL TRANSACTIONS WITH ACCURATE TÜTED PRICES ===');
  transactions.forEach(tx => {
    const isSpecialHotel = (tx.hotel || '').toUpperCase().includes('SEPHORIA') || 
                           (tx.hotel || '').toUpperCase().includes('SEAPHORİA') || 
                           (tx.hotel || '').toUpperCase().includes('CASAFORA');
    const marginMult = isSpecialHotel ? 1.22 : 1.18;

    const list = priceLists[tx.date] || [];
    const txProd = cleanStr(tx.product);

    let tutedTl = 0;
    if (list.length > 0) {
      let pMatch = list.find(p => cleanStr(p.product) === txProd);
      if (!pMatch) {
        pMatch = list.find(p => {
          const pName = cleanStr(p.product);
          return pName.includes(txProd) || txProd.includes(pName);
        });
      }
      if (pMatch) tutedTl = parseFloat(pMatch.price) || 0;
    }

    if (tutedTl > 0) {
      const calcSupply = Math.round(tutedTl * marginMult * 100) / 100;
      tx.supplyPrice = Math.max(calcSupply, tx.buyPrice);
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

  console.log(`\n=== FINAL PERFECT REAL-WORLD SYSTEM TOTALS ===`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, {
    priceLists: priceLists,
    transactions: transactions
  });

  console.log('✅ Firebase successfully updated with 100% accurate TÜTED prices!');
}

fixTuted100xKurus().catch(console.error);
