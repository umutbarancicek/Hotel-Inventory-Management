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

async function main() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const txs = docSnap.data().transactions || [];

  const may31 = txs.filter(t => t.date === '2026-05-31');
  const june14 = txs.filter(t => t.date === '2026-06-14');

  console.log(`May 31 transactions count in DB: ${may31.length}`);
  may31.forEach(t => {
    console.log(`  ${t.supplier} | ${t.product} | ${t.hotel} | Qty: ${t.qty} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice}`);
  });

  console.log(`\nJune 14 transactions count in DB: ${june14.length}`);
  june14.forEach(t => {
    console.log(`  ${t.supplier} | ${t.product} | ${t.hotel} | Qty: ${t.qty} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice}`);
  });
}

main().catch(console.error);
