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

// Check a July date, e.g. 2026-07-22
const docSnap = await getDoc(doc(db, 'priceLists', '2026-07-22'));
if (docSnap.exists()) {
  console.log('2026-07-22 Price List data keys:', Object.keys(docSnap.data()));
  console.log('Sample data:', JSON.stringify(docSnap.data()).slice(0, 500));
} else {
  console.log('2026-07-22 not found.');
}
