import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA1Iv_1fqFSVI-P4Y_g1QlCgB4CMsRZJFI",
  authDomain: "miramor-inventory-management.firebaseapp.com",
  projectId: "miramor-inventory-management",
  storageBucket: "miramor-inventory-management.firebasestorage.app",
  messagingSenderId: "539349013423",
  appId: "1:539349013423:web:53cb425931b51b1530d55a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkHavuc() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const havucTxs = transactions.filter(t => t.product.includes('HAVUÇ'));

  console.log(`Total Havuç transactions in DB: ${havucTxs.length}`);
  havucTxs.slice(0, 15).forEach((t, i) => {
    console.log(`${i+1}. Date: ${t.date} | Supplier: ${t.supplier} | Hotel: ${t.hotel} | Qty: ${t.qty} | Buy: ₺${t.buyPrice} | Supply: ₺${t.supplyPrice}`);
  });
}

checkHavuc().catch(console.error);
