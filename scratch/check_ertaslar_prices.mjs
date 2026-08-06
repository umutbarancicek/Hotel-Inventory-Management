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

async function checkErtaslar() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const ertTxs = transactions.filter(t => t.supplier === 'ERTAŞLAR');

  console.log(`Total Ertaşlar transactions in DB: ${ertTxs.length}`);
  console.log('\nSample Ertaşlar prices (first 10):');
  ertTxs.slice(0, 10).forEach((t, i) => {
    console.log(`${i+1}. Date: ${t.date} | Hotel: ${t.hotel} | Product: ${t.product} | Buy: ₺${t.buyPrice} | Supply: ₺${t.supplyPrice}`);
  });
}

checkErtaslar().catch(console.error);
