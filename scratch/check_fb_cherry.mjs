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

async function checkFirebaseCherry() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const cherry = data.transactions.filter(t => t.supplier === 'ERTAŞLAR' && t.date === '2026-06-14' && t.product.includes('CHERRY') || t.product.includes('ÇERİ'));
  console.log('Firebase Cherry transactions on 14.06.2026:');
  cherry.forEach(t => console.log(JSON.stringify(t)));

  const potatoes = data.transactions.filter(t => t.supplier === 'ERTAŞLAR' && t.date === '2026-06-14' && t.product === 'PATATES' && t.qty === 400);
  console.log('Firebase Potatoes 400kg transactions on 14.06.2026:');
  potatoes.forEach(t => console.log(JSON.stringify(t)));
}

checkFirebaseCherry();
