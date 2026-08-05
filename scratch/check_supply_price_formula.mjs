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

async function checkFormula() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const txs = data.transactions || [];

  console.log('Sample Antalya Hal transactions:');
  const ant = txs.filter(t => t.supplier === 'ANTALYA HAL' && t.date > '2026-07-10').slice(0, 5);
  ant.forEach(t => {
    console.log(`Prod: ${t.product} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice} | Ratio: ${(t.supplyPrice / (t.buyPrice || 1)).toFixed(2)}`);
  });

  console.log('\nSample Kumluca Hal transactions:');
  const kum = txs.filter(t => t.supplier === 'KUMLUCA HAL' && t.date > '2026-07-10').slice(0, 5);
  kum.forEach(t => {
    console.log(`Prod: ${t.product} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice} | Ratio: ${(t.supplyPrice / (t.buyPrice || 1)).toFixed(2)}`);
  });
}

checkFormula();
