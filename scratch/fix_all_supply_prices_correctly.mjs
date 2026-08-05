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

function parsePriceVal(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = String(str).replace(/\./g, '').replace(',', '.').trim();
  let val = parseFloat(clean) || 0;
  if (val >= 100) val = val / 10;
  return val;
}

function getMarginMult(hotelName) {
  const hUpper = (hotelName || '').toUpperCase().trim();
  if (hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA')) {
    return 2.20;
  }
  return 1.80;
}

async function fixSupplyPrices() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const priceLists = data.priceLists || {};

  let fixedCount = 0;

  transactions.forEach(tx => {
    const list = priceLists[tx.date] || [];
    if (list.length === 0) return;

    const prodClean = cleanStr(tx.product);

    let pMatch = list.find(p => cleanStr(p.product) === prodClean);
    if (!pMatch) {
      pMatch = list.find(p => {
        const pName = cleanStr(p.product);
        return pName.includes(prodClean) || prodClean.includes(pName);
      });
    }

    if (pMatch) {
      const tutedVal = parsePriceVal(pMatch.price);
      if (tutedVal > 0) {
        const mult = getMarginMult(tx.hotel);
        const correctSupply = Math.round(tutedVal * mult * 100) / 100;
        tx.supplyPrice = correctSupply;
        fixedCount++;
      }
    }
  });

  console.log(`Correctly updated supplyPrice for ${fixedCount} transactions.`);

  let totalHal = 0;
  let totalTed = 0;

  transactions.forEach(t => {
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\nNew System Totals:`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, { transactions });
  console.log('✅ Firebase successfully updated with correct supply prices!');
}

fixSupplyPrices();
