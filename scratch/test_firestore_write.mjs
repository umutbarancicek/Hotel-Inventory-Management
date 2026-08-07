import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

async function main() {
  const ref = doc(db, 'storage', 'appData');
  
  console.log('Reading appData...');
  const snap = await getDoc(ref);
  const txs = snap.data().transactions || [];
  console.log('Current count:', txs.length);
  
  // Test write: append a dummy item
  const dummyItem = {
    id: 999999999999,
    date: '2026-08-07',
    supplier: 'TEST_SUPPLIER',
    hotel: 'TEST_HOTEL',
    product: 'TEST_PRODUCT',
    qty: 1,
    buyPrice: 1,
    supplyPrice: 1
  };
  
  console.log('Updating document...');
  try {
    await updateDoc(ref, { transactions: [...txs, dummyItem] });
    console.log('Write operation completed.');
  } catch (err) {
    console.error('Write failed:', err);
  }
  
  console.log('Re-reading document...');
  const snap2 = await getDoc(ref);
  const txs2 = snap2.data().transactions || [];
  console.log('New count:', txs2.length);
  
  // Clean up
  const cleaned = txs2.filter(t => t.id !== 999999999999);
  await updateDoc(ref, { transactions: cleaned });
  console.log('Cleaned up dummy item.');
}

main().catch(console.error);
