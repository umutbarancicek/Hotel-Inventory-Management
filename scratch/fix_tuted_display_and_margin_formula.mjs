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

async function fixTutedDisplayAndMargins() {
  console.log('=== FIXING TÜTED DISPLAY (e.g. 320.00 TL instead of 3.20 TL) AND EXACT MARGIN FORMULA ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const transactions = data.transactions || [];

  let updatedCount = 0;

  transactions.forEach(tx => {
    const list = priceLists[tx.date] || [];
    const txProd = cleanStr(tx.product);

    let rawTutedPrice = 0;
    if (list.length > 0) {
      let pMatch = list.find(p => cleanStr(p.product) === txProd);
      if (!pMatch) {
        pMatch = list.find(p => {
          const pName = cleanStr(p.product);
          return pName.includes(txProd) || txProd.includes(pName);
        });
      }
      if (pMatch) {
        let p = (typeof pMatch.price === 'number') ? pMatch.price : parseFloat(String(pMatch.price).replace(/\./g, '').replace(',', '.')) || 0;
        rawTutedPrice = p;
      }
    }

    const hUpper = cleanStr(tx.hotel);
    const isSpecialHotel = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORIA') || hUpper.includes('CASAFORA');
    const marginRate = isSpecialHotel ? 0.22 : 0.18;

    if (rawTutedPrice > 0) {
      // If raw price is e.g. 32000 kuruş -> 320.00 TL
      let realTlTuted = rawTutedPrice;
      if (realTlTuted > 2000.0) realTlTuted = realTlTuted / 100.0;

      tx.supplyPrice = Math.round(realTlTuted * marginRate * 100) / 100;
      updatedCount++;
    } else if (tx.supplyPrice > 0) {
      // Keep existing supplyPrice
    }
  });

  console.log(`Updated ${updatedCount} transactions.`);

  // Sample Limon on 03.08.2026 for Miramor Garden
  const limonTx = transactions.find(t => t.date === '2026-08-03' && cleanStr(t.product).includes('LIMON') && cleanStr(t.hotel).includes('MIRAMOR'));
  if (limonTx) {
    console.log('\nSample 03.08.2026 Limon (Miramor Garden):');
    console.log(`Supplier: ${limonTx.supplier} | Hotel: ${limonTx.hotel} | Qty: ${limonTx.qty} | Buy: ₺${limonTx.buyPrice} | Supply: ₺${limonTx.supplyPrice}`);
    console.log(`Derived TÜTED (Supply / 0.18): ₺${(limonTx.supplyPrice / 0.18).toFixed(2)}`);
  }

  await updateDoc(docRef, {
    transactions: transactions
  });

  console.log('✅ Firebase DB updated successfully!');
}

fixTutedDisplayAndMargins().catch(console.error);
