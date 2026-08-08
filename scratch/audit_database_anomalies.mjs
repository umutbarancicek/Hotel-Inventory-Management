/**
 * DATABASE ANOMALIES AUDIT
 * 
 * Check transactions array for:
 * 1. Negative margin (buyPrice > supplyPrice) when buyPrice > 0
 * 2. Extremely high prices (> 500 TL/kg) for standard products (excluding expensive berries/saffron/truffles/etc.)
 * 3. Outlier supply prices (supplyPrice / buyPrice is extremely high, e.g. > 10x, or extremely low, e.g. < 1x)
 * 4. Zero quantities or zero prices
 * 5. Format errors (non-ISO dates, non-numeric values)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

const EXPENSIVE_PRODUCTS = new Set([
  'BLUE BERRY', 'RED BERRY', 'AHUDUDU', 'BÖĞÜRTLEN', 'SARIMSAK İTHAL', 'ZENCEFİL',
  'YABAN MERSİNİ', 'MASRAF', 'KUŞKONMAZ', 'AVAKADO İTHAL', 'BİBER KALİFORNİYA'
]);

async function main() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.error('appData not found!');
    return;
  }
  
  const data = docSnap.data();
  const txs = data.transactions || [];
  console.log(`Total transactions to audit: ${txs.length}\n`);

  const anomalies = {
    negativeMargin: [],
    extremelyHighPrice: [],
    ratioOutlier: [],
    zeroQty: [],
    zeroPrice: [],
    badDate: []
  };

  txs.forEach((t, idx) => {
    // 1. Date format check
    if (!t.date || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
      anomalies.badDate.push({ index: idx, tx: t });
    }

    const qty = parseFloat(t.qty);
    const buy = parseFloat(t.buyPrice);
    const supply = parseFloat(t.supplyPrice);

    // 2. Zero check
    if (qty <= 0) {
      anomalies.zeroQty.push({ index: idx, tx: t });
    }
    if (buy === 0) {
      anomalies.zeroPrice.push({ index: idx, tx: t, reason: 'buyPrice is 0' });
    }
    if (supply === 0) {
      anomalies.zeroPrice.push({ index: idx, tx: t, reason: 'supplyPrice is 0' });
    }

    // 3. Negative margin
    if (buy > 0 && supply > 0 && supply < buy) {
      anomalies.negativeMargin.push({ index: idx, tx: t });
    }

    // 4. Extremely high price (> 200 TL/kg for normal products)
    const prodUpper = (t.product || '').toUpperCase();
    if (buy > 200 && !EXPENSIVE_PRODUCTS.has(prodUpper) && !prodUpper.includes('MASRAF')) {
      anomalies.extremelyHighPrice.push({ index: idx, tx: t });
    }

    // 5. Ratio outlier (e.g. supplyPrice is more than 3x buyPrice or less than 1.1x buyPrice when buy > 0)
    if (buy > 0 && supply > 0) {
      const ratio = supply / buy;
      if (ratio > 5.0 || ratio < 1.0) {
        anomalies.ratioOutlier.push({ index: idx, tx: t, ratio });
      }
    }
  });

  console.log(`--- Audit Results ---`);
  console.log(`Negative Margin (buy > supply):    ${anomalies.negativeMargin.length}`);
  console.log(`Extremely High Price (>200 TL):   ${anomalies.extremelyHighPrice.length}`);
  console.log(`Ratio Outliers (<1.0x or >5.0x):   ${anomalies.ratioOutlier.length}`);
  console.log(`Zero Quantity:                     ${anomalies.zeroQty.length}`);
  console.log(`Zero Price:                        ${anomalies.zeroPrice.length}`);
  console.log(`Bad Date Format:                   ${anomalies.badDate.length}`);
  
  if (anomalies.negativeMargin.length > 0) {
    console.log('\n--- Negative Margin Samples (first 10) ---');
    anomalies.negativeMargin.slice(0, 10).forEach(a => {
      console.log(`  Date: ${a.tx.date} | Hotel: ${a.tx.hotel} | Product: ${a.tx.product} | Buy: ${a.tx.buyPrice} | Supply: ${a.tx.supplyPrice} | Diff: ${a.tx.supplyPrice - a.tx.buyPrice}`);
    });
  }

  if (anomalies.extremelyHighPrice.length > 0) {
    console.log('\n--- Extremely High Price Samples (first 10) ---');
    anomalies.extremelyHighPrice.slice(0, 10).forEach(a => {
      console.log(`  Date: ${a.tx.date} | Hotel: ${a.tx.hotel} | Product: ${a.tx.product} | Qty: ${a.tx.qty} | BuyPrice: ${a.tx.buyPrice} | Supply: ${a.tx.supplyPrice}`);
    });
  }

  if (anomalies.ratioOutlier.length > 0) {
    console.log('\n--- Ratio Outlier Samples (first 10) ---');
    anomalies.ratioOutlier.slice(0, 10).forEach(a => {
      console.log(`  Date: ${a.tx.date} | Product: ${a.tx.product} | Buy: ${a.tx.buyPrice} | Supply: ${a.tx.supplyPrice} | Ratio: ${a.ratio.toFixed(2)}x`);
    });
  }
}

main().catch(console.error);
