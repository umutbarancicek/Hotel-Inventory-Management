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

async function debugBillion() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const transactions = data.transactions || [];

  console.log('Top 15 highest Tedarik Tutarı transactions:');
  const sorted = [...transactions].sort((a, b) => (b.qty * (b.supplyPrice || b.buyPrice)) - (a.qty * (a.supplyPrice || a.buyPrice)));

  sorted.slice(0, 15).forEach(t => {
    const tedTutar = t.qty * (t.supplyPrice || t.buyPrice);
    console.log(`ID: ${t.id} | Date: ${t.date} | Hotel: ${t.hotel} | Prod: ${t.product} | Qty: ${t.qty} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice} | TedTutar: ₺${tedTutar.toLocaleString()}`);
  });
}

debugBillion();
