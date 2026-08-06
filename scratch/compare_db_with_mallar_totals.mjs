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

async function compareDbTotals() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];

  console.log(`Total transactions in DB: ${transactions.length}`);

  // Group by date ranges
  const dateMap = {};
  transactions.forEach(t => {
    const d = t.date || 'UNKNOWN';
    if (!dateMap[d]) dateMap[d] = { count: 0, kg: 0, hal: 0, ted: 0 };
    dateMap[d].count++;
    dateMap[d].kg += (t.qty || 0);
    dateMap[d].hal += (t.qty || 0) * (t.buyPrice || 0);
    const effSupply = t.supplyPrice > 0 ? t.supplyPrice : t.buyPrice;
    dateMap[d].ted += (t.qty || 0) * effSupply;
  });

  const sortedDates = Object.keys(dateMap).sort();

  console.log('\n--- DAILY BREAKDOWN ---');
  sortedDates.forEach(d => {
    const info = dateMap[d];
    console.log(`${d}: Count=${info.count} | Kg=${info.kg.toFixed(1)} | Hal=₺${info.hal.toFixed(2)} | Ted=₺${info.ted.toFixed(2)} | Fark=₺${(info.ted - info.hal).toFixed(2)}`);
  });

  // Filter up to 04.08.2026
  const txUpTo0408 = transactions.filter(t => t.date <= '2026-08-04');
  let sumKg = 0, sumHal = 0, sumTed = 0;
  txUpTo0408.forEach(t => {
    sumKg += t.qty;
    sumHal += t.qty * t.buyPrice;
    const eff = t.supplyPrice > 0 ? t.supplyPrice : t.buyPrice;
    sumTed += t.qty * eff;
  });

  console.log('\n=== DB TOTALS UP TO 04.08.2026 ===');
  console.log(`Tx Count: ${txUpTo0408.length}`);
  console.log(`Total Kg: ${sumKg.toLocaleString('tr-TR')} kg`);
  console.log(`Hal Maliyeti: ₺${sumHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Tedarik Tutarı: ₺${sumTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Net Fark (Kâr): ₺${(sumTed - sumHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  console.log('\n=== TARGET PDF REPORT (mallar.pdf) METRICS ===');
  console.log(`Total Kg: 277.331 kg`);
  console.log(`Hal Maliyeti: ₺5.759.603,00`);
  console.log(`Tedarik Tutarı: ₺11.004.733,66`);
  console.log(`Net Fark (Kâr): ₺5.245.130,66`);
}

compareDbTotals().catch(console.error);
