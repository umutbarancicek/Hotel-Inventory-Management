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
console.log('Current total transactions count in DB:', txs.length);

const aug4 = txs.filter(t => t.date === '2026-08-04' && t.supplier === 'MSD07 TAR ÜR');
console.log(`Found ${aug4.length} transactions for MSD07 TAR ÜR on 2026-08-04`);
if (aug4.length > 0) {
  console.log('Sample transaction:', aug4[0]);
}

const july4 = txs.filter(t => t.date === '2026-07-04' && t.supplier === 'MSD07 TAR ÜR');
console.log(`Found ${july4.length} transactions for MSD07 TAR ÜR on 2026-07-04`);
