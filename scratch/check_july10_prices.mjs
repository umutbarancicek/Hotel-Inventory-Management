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

const d = await getDoc(doc(db, 'priceLists', '2026-07-10'));
const prices = d.data()?.prices || {};
console.log('2026-07-10 products:', Object.keys(prices).length);
Object.entries(prices).sort().forEach(([k,v]) => console.log(`  "${k}": ${v}`));
