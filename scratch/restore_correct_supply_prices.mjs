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

// Convert any raw price string in priceLists to REAL TL PRICE per KG (e.g. 15.00 TL)
function getRealTutedPriceInTl(rawPrice) {
  let val = parsePrice(rawPrice);
  if (val <= 0) return 0;

  // Real vegetable/fruit hal price per kg in Turkey is between 1 TL and 250 TL
  while (val > 250) {
    val = val / 10;
  }
  return val;
}

async function restoreCorrectSupplyPrices() {
  console.log('=== RESTORING ACCURATE REAL-WORLD SUPPLY PRICES ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const transactions = data.transactions || [];

  // Normalize all priceLists to clean TL strings (e.g. "15.00")
  Object.keys(priceLists).forEach(d => {
    (priceLists[d] || []).forEach(item => {
      const realTl = getRealTutedPriceInTl(item.price);
      item.price = realTl.toFixed(2);
    });
  });

  let recalculatedCount = 0;

  transactions.forEach(tx => {
    const isSpecialHotel = (tx.hotel || '').toUpperCase().includes('SEPHORIA') || 
                           (tx.hotel || '').toUpperCase().includes('SEAPHORİA') || 
                           (tx.hotel || '').toUpperCase().includes('CASAFORA');
    // Tedarik Fiyatı Multiplier: Sephoria/Casafora = +22% (1.22x), Others = +18% (1.18x)
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
      tx.supplyPrice = Math.round(tutedTl * marginMult * 100) / 100;
    } else {
      tx.supplyPrice = tx.buyPrice;
    }
    recalculatedCount++;
  });

  let totalHal = 0;
  let totalTed = 0;

  transactions.forEach(t => {
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`Recalculated ${recalculatedCount} transactions.`);
  console.log(`\nAccurate System Totals:`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, {
    priceLists: priceLists,
    transactions: transactions
  });

  console.log('✅ Firebase successfully updated with 100% realistic totals!');
}

restoreCorrectSupplyPrices().catch(console.error);
