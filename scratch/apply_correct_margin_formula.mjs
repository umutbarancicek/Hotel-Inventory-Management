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

function toRealTlTutedPrice(rawPrice) {
  let val = parsePrice(rawPrice);
  if (val <= 0) return 0;
  while (val > 25000.0) val = val / 100.0;
  if (val >= 250.0) val = val / 100.0;
  return Math.round(val * 100) / 100;
}

async function applyCorrectMarginFormula() {
  console.log('=== APPLYING EXACT %18 / %22 MARGIN FORMULA TO TRANSACTIONS ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const transactions = data.transactions || [];

  let updatedCount = 0;

  transactions.forEach(tx => {
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
      if (pMatch) tutedVal = toRealTlTutedPrice(pMatch.price);
    }

    const hUpper = cleanStr(tx.hotel);
    const isSpecialHotel = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORIA') || hUpper.includes('CASAFORA');
    const marginMult = isSpecialHotel ? 1.22 : 1.18;

    if (tutedVal > 0) {
      const calcSupply = Math.round(tutedVal * marginMult * 100) / 100;
      tx.supplyPrice = Math.max(calcSupply, tx.buyPrice);
      updatedCount++;
    } else {
      const calcSupply = Math.round(tx.buyPrice * marginMult * 100) / 100;
      tx.supplyPrice = Math.max(calcSupply, tx.buyPrice);
    }
  });

  console.log(`Updated ${updatedCount} transactions with exact TÜTED %18 / %22 margins.`);

  const havucTxs = transactions.filter(t => t.date === '2026-08-04' && cleanStr(t.product).includes('HAVUC'));
  console.log('\nSample 04.08.2026 Havuç Beypazarı transactions after correct margin rule:');
  havucTxs.forEach(t => {
    console.log(`Supplier: ${t.supplier} | Hotel: ${t.hotel} | Product: ${t.product} | Buy: ₺${t.buyPrice} | Supply (TÜTED x Margin): ₺${t.supplyPrice}`);
  });

  let totalHal = 0;
  let totalTed = 0;
  transactions.forEach(t => {
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\n=== CORRECT MARGIN RULE SYSTEM TOTALS ===`);
  console.log(`Total Transactions: ${transactions.length}`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, {
    transactions: transactions
  });

  console.log('✅ Firebase successfully updated with correct %18 / %22 margins!');
}

applyCorrectMarginFormula().catch(console.error);
