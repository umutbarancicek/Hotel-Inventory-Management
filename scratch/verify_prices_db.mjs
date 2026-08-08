import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA1Iv_1fkFSVI-P4Y_g1QlCgB4CMsRZJFI",
  authDomain: "miramor-inventory-management.firebaseapp.com",
  projectId: "miramor-inventory-management",
  storageBucket: "miramor-inventory-management.firebasestorage.app",
  shadowProjectId: "miramor-inventory-management",
  messagingSenderId: "539349013423",
  appId: "1:539349013423:web:53cb425931b51b1530d55a"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check 17.06.2026 price list in DB
const docSnap17 = await getDoc(doc(db, 'priceLists', '2026-06-17'));
if (docSnap17.exists()) {
  const prices = docSnap17.data().prices || {};
  console.log('17.06.2026 Kavun price in DB:', prices['KAVUN']);
  console.log('All prices on 17.06.2026:', Object.keys(prices).filter(k => k.includes('KAVUN') || k.includes('KARPUZ')).map(k => `${k}: ${prices[k]}`));
} else {
  console.log('17.06.2026 price list not found.');
}

// Check 15.06.2026 price list in DB
const docSnap15 = await getDoc(doc(db, 'priceLists', '2026-06-15'));
if (docSnap15.exists()) {
  const prices = docSnap15.data().prices || {};
  console.log('15.06.2026 Karpuz price in DB:', prices['KARPUZ']);
  console.log('All prices on 15.06.2026:', Object.keys(prices).filter(k => k.includes('KAVUN') || k.includes('KARPUZ')).map(k => `${k}: ${prices[k]}`));
} else {
  console.log('15.06.2026 price list not found.');
}
