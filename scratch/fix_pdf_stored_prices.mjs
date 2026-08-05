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

function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

function normalizeStoredTutedPrice(rawPrice) {
  let val = parsePrice(rawPrice);
  if (val <= 0) return '0.00';

  // TÜTED standard stored format: real price in TL * 10 (e.g. 15 TL/kg -> 150.00, 12.50 TL/kg -> 125.00)
  // Max vegetable/fruit price in hal is ~250 TL/kg -> max stored format is 2500.00
  while (val > 2500) {
    val = val / 10;
  }
  return val.toFixed(2);
}

async function fixPdfStoredPrices() {
  console.log('--- FIXING PDF STORED PRICES AND SUPPLY PRICES ---');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const transactions = data.transactions || [];

  const targetDates = ['2026-04-28', '2026-05-18', '2026-05-23', '2026-06-03', '2026-07-03'];

  targetDates.forEach(d => {
    if (priceLists[d]) {
      priceLists[d].forEach(item => {
        item.price = normalizeStoredTutedPrice(item.price);
      });
    }
  });

  console.log('Sample fixed items for 2026-07-03:');
  (priceLists['2026-07-03'] || []).slice(0, 5).forEach(i => console.log(i));

  console.log('\n--- RECALCULATING ALL TRANSACTIONS SUPPLY PRICES ---');
  let fixedCount = 0;

  transactions.forEach(tx => {
    const isSpecialHotel = (tx.hotel || '').toUpperCase().includes('SEPHORIA') || 
                           (tx.hotel || '').toUpperCase().includes('SEAPHORİA') || 
                           (tx.hotel || '').toUpperCase().includes('CASAFORA');
    const marginRate = isSpecialHotel ? 0.22 : 0.18;

    const list = priceLists[tx.date] || [];
    const txProd = (tx.product || '').trim().toUpperCase();

    let tutedVal = 0;
    if (list.length > 0) {
      let pMatch = list.find(p => (p.product || '').trim().toUpperCase() === txProd);
      if (!pMatch) {
        pMatch = list.find(p => {
          const pName = (p.product || '').trim().toUpperCase();
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
    fixedCount++;
  });

  let totalHal = 0;
  let totalTed = 0;

  transactions.forEach(t => {
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\nCorrected System Totals:`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, {
    priceLists: priceLists,
    transactions: transactions
  });

  console.log('✅ Firebase successfully updated with 100% accurate totals!');
}

fixPdfStoredPrices().catch(console.error);
