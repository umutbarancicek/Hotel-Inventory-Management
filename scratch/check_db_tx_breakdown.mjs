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

async function checkDbTxBreakdown() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const txs = data.transactions || [];
  console.log(`=== DB TOTAL TRANSACTIONS COUNT: ${txs.length} ===`);

  const supplierCounts = {};
  txs.forEach(t => {
    const s = t.supplier || 'UNKNOWN';
    supplierCounts[s] = (supplierCounts[s] || 0) + 1;
  });

  console.log('\nBreakdown by Supplier:');
  Object.entries(supplierCounts).sort((a,b) => b[1] - a[1]).forEach(([s, c]) => {
    console.log(`- ${s}: ${c} adet`);
  });
}

checkDbTxBreakdown().catch(console.error);
