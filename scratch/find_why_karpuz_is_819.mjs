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

async function checkKarpuz819() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const transactions = data.transactions || [];

  console.log('KARPUZ in priceLists for 2026-06-27:');
  console.log((priceLists['2026-06-27'] || []).filter(p => p.product.includes('KARPUZ')));

  console.log('\nKARPUZ in priceLists for 2026-07-03:');
  console.log((priceLists['2026-07-03'] || []).filter(p => p.product.includes('KARPUZ')));

  console.log('\nSample KARPUZ transactions:');
  transactions.filter(t => t.product.includes('KARPUZ')).slice(0, 5).forEach(t => {
    console.log(`ID: ${t.id} | Date: ${t.date} | Hotel: ${t.hotel} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice}`);
  });
}

checkKarpuz819();
