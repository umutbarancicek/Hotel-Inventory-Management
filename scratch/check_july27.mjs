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

const d = await getDoc(doc(db, 'priceLists', '2026-07-27'));
if (d.exists()) {
  const data = d.data();
  console.log('2026-07-27 exists, source:', data.source);
  console.log('Product count:', Object.keys(data.prices || {}).length);
  console.log('Sample prices:', Object.entries(data.prices || {}).slice(0, 5));
} else {
  console.log('2026-07-27 does not exist');
}
