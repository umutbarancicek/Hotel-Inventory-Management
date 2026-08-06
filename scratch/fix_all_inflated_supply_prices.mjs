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

async function fixInflatedSupplyPrices() {
  console.log('=== REPAIRING ALL INFLATED TRANSACTION SUPPLY PRICES ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];

  let fixedCount = 0;
  transactions.forEach(t => {
    const isSpecialHotel = (t.hotel || '').toUpperCase().includes('SEPHORIA') || 
                           (t.hotel || '').toUpperCase().includes('SEAPHORİA') || 
                           (t.hotel || '').toUpperCase().includes('CASAFORA');
    const marginMult = isSpecialHotel ? 1.22 : 1.18;

    // Expected normal supply price is buyPrice * 1.18 or 1.22
    const normalSupply = Math.round(t.buyPrice * marginMult * 100) / 100;

    // If supplyPrice was inflated wildly above normal (e.g. > 2.5x buyPrice), fix it back to normalSupply
    if (t.supplyPrice > t.buyPrice * 2.5) {
      t.supplyPrice = normalSupply;
      fixedCount++;
    }
  });

  console.log(`Successfully repaired ${fixedCount} inflated transactions back to clean normal supply prices.`);

  let totalHal = 0;
  let totalTed = 0;
  transactions.forEach(t => {
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\n=== REAL WORLD SYSTEM TOTALS AFTER REPAIR ===`);
  console.log(`Total Transactions: ${transactions.length}`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, {
    transactions: transactions
  });

  console.log('✅ Firebase transactions successfully repaired and saved!');
}

fixInflatedSupplyPrices().catch(console.error);
