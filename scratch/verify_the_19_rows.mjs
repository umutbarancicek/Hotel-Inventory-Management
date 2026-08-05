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

async function checkThe19Rows() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const priceLists = data.priceLists || {};

  const targetDates = ['2026-07-03', '2026-06-03', '2026-05-24', '2026-05-23', '2026-05-18', '2026-04-28'];

  console.log('=== CHECKING SAMPLE TRANSACTIONS ON IMPORTED DATES ===');

  targetDates.forEach(d => {
    const list = priceLists[d] || [];
    const sampleTxs = transactions.filter(t => t.date === d).slice(0, 3);
    console.log(`\nDate ${d} (PriceList items: ${list.length}):`);
    sampleTxs.forEach(t => {
      console.log(`  • ${t.product} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
    });
  });
}

checkThe19Rows();
