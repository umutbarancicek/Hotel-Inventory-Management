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

async function inspectCrazyTxs() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const priceLists = data.priceLists || {};

  console.log(`Total transactions in DB: ${transactions.length}`);

  const crazyTxs = transactions.filter(t => t.supplyPrice > 100);
  console.log(`Found ${crazyTxs.length} transactions with supplyPrice > 100 TL!`);

  console.log('\nSample crazy transactions:');
  crazyTxs.slice(0, 10).forEach(t => {
    console.log(`${t.date} | ${t.supplier} | ${t.product} | Qty: ${t.qty} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice} | Hotel: ${t.hotel}`);
  });
}

inspectCrazyTxs();
