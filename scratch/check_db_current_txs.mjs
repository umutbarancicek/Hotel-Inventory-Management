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

async function checkDbCurrentTxs() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const txs = data.transactions || [];
  console.log(`Current DB Transactions Count: ${txs.length}`);

  const dates = [...new Set(txs.map(t => t.date))].sort();
  console.log(`Date range in DB: ${dates[0]} to ${dates[dates.length - 1]}`);

  let totalKg = 0;
  let totalHal = 0;
  let totalTed = 0;

  txs.forEach(t => {
    totalKg += t.qty;
    totalHal += t.qty * t.buyPrice;
    totalTed += t.qty * t.supplyPrice;
  });

  console.log(`Total Kg: ${totalKg.toLocaleString('tr-TR')} kg`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  // Sample transactions
  console.log('\nSample transactions 1-5:');
  txs.slice(0, 5).forEach((t, i) => console.log(`${i+1}. ${t.date} | ${t.supplier} | ${t.hotel} | ${t.product} | Qty: ${t.qty} | Buy: ₺${t.buyPrice} | Teda: ₺${t.supplyPrice}`));
}

checkDbCurrentTxs().catch(console.error);
