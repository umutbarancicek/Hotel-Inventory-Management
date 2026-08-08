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

const docSnap = await getDoc(doc(db, 'storage', 'appData'));
const txs = docSnap.data().transactions || [];

console.log('Search for NEKTARİN on 2026-07-11:');
const matches = txs.filter(t => t.date === '2026-07-11' && (t.product || '').toUpperCase().includes('NEKTAR'));
matches.forEach(t => {
  console.log(`  Hotel: ${t.hotel} | Qty: ${t.qty} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice}`);
});
