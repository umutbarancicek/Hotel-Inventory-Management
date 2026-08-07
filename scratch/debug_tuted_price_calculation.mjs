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

async function run() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  // Let's check a transaction on 2026-04-24 for BİBER DOLMA
  const tx = data.transactions.find(t => t.date === '2026-04-24' && t.product === 'BİBER DOLMA');
  console.log('Transaction:', tx);

  // Let's check the priceList for 2026-04-24 from collection
  const plistDocRef = doc(db, 'priceLists', '2026-04-24');
  const plistSnap = await getDoc(plistDocRef);
  if (plistSnap.exists()) {
    const list = plistSnap.data().items;
    const match = list.find(p => p.product.includes('DOLMA'));
    console.log('PriceList matching item:', match);
  } else {
    console.log('PriceList doc not found in collection!');
  }
}

run().catch(console.error);
