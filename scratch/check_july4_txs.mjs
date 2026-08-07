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

const snap = await getDoc(doc(db, 'storage', 'appData'));
const txs = snap.data().transactions || [];
const july4 = txs.filter(t => t.date === '2026-07-04');

console.log(`Transactions on 2026-07-04 (${july4.length}):`);
july4.forEach(t => {
  console.log(`  ${t.supplier} | ${t.product} -> ${t.hotel} | ${t.qty} kg | Buy: ₺${t.buyPrice} | Supply: ₺${t.supplyPrice}`);
});
