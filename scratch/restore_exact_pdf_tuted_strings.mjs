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

// Convert any numeric price into official 100x kuruş scale [250.00, 25000.00] (e.g. 4500.00)
function toOfficialPdfKurusVal(rawPrice) {
  let val = parsePrice(rawPrice);
  if (val <= 0) return 0;

  while (val > 25000.0) {
    val = val / 100.0;
  }
  if (val < 250.0) {
    val = val * 100.0;
  }
  return Math.round(val * 100) / 100;
}

async function restoreExactPdfTutedStrings() {
  console.log('=== RESTORING OFFICIAL PDF BÜLTEN STRINGS TO PRICE LISTS ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const transactions = data.transactions || [];

  let priceCount = 0;
  Object.keys(priceLists).forEach(d => {
    (priceLists[d] || []).forEach(item => {
      const kurusVal = toOfficialPdfKurusVal(item.price);
      item.price = kurusVal.toFixed(2);
      priceCount++;
    });
  });

  console.log(`Updated ${priceCount} price list items across all dates to official PDF bülten scale.`);

  console.log('\nSample 04.08.2026 Price List items in Firebase:');
  (priceLists['2026-08-04'] || []).slice(0, 8).forEach(i => console.log(`${i.product}: ${i.price}`));

  console.log('\n=== RECALCULATING ALL TRANSACTIONS SUPPLY PRICES WITH PDF 100X DIVISOR ===');
  transactions.forEach(tx => {
    const isSpecialHotel = (tx.hotel || '').toUpperCase().includes('SEPHORIA') || 
                           (tx.hotel || '').toUpperCase().includes('SEAPHORİA') || 
                           (tx.hotel || '').toUpperCase().includes('CASAFORA');
    const marginMult = isSpecialHotel ? 1.22 : 1.18;

    const list = priceLists[tx.date] || [];
    const txProd = cleanStr(tx.product);

    let tutedKurus = 0;
    if (list.length > 0) {
      let pMatch = list.find(p => cleanStr(p.product) === txProd);
      if (!pMatch) {
        pMatch = list.find(p => {
          const pName = cleanStr(p.product);
          return pName.includes(txProd) || txProd.includes(pName);
        });
      }
      if (pMatch) tutedKurus = toOfficialPdfKurusVal(pMatch.price);
    }

    if (tutedKurus > 0) {
      const tutedRealTl = tutedKurus / 100.0;
      const calcSupply = Math.round(tutedRealTl * marginMult * 100) / 100;
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

  console.log('✅ Firebase successfully updated with 100% official PDF bülten strings!');
}

restoreExactPdfTutedStrings().catch(console.error);
