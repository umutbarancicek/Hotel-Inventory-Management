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

const docSnap = await getDoc(doc(db, 'priceLists', '2026-04-24'));
const items = docSnap.data().items;

const cherry = items.find(i => i.product.includes('CHERRY') || i.product.includes('ÇERİ'));
console.log('DOMATES CHERRY in 2026-04-24 price list:', cherry);

// Let's also print other tomatoes to see if their prices are normal
const tomatoes = items.filter(i => i.product.includes('DOMATES'));
console.log('All tomatoes:', tomatoes);
