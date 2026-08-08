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

const melon = txs.filter(t => t.product === 'KARPUZ' || t.product === 'KAVUN');
console.log(`Karpuz/Kavun işlem sayısı: ${melon.length}`);
console.log('\nTüm Karpuz/Kavun kayıtları:');
melon.forEach(t => {
  console.log(`  ${t.date} | ${t.hotel} | ${t.product} | Qty: ${t.qty} kg | Supply: ₺${t.supplyPrice} | TÜTED: ₺${t.tuted || '?'}`);
});
