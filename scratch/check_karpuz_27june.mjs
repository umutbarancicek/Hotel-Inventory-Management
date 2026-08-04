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

async function checkKarpuz27June() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  console.log('=== PRICE LIST FOR 2026-06-27 ===');
  const priceList27 = data.priceLists ? data.priceLists['2026-06-27'] : null;
  if (priceList27) {
    const karpuz = priceList27.find(p => p.product.includes('KARPUZ'));
    console.log('PriceList KARPUZ:', karpuz);
  } else {
    console.log('No priceList for 2026-06-27!');
  }

  console.log('\n=== TRANSACTIONS FOR 2026-06-27 KARPUZ ===');
  const txs = data.transactions.filter(t => t.date === '2026-06-27' && t.product.includes('KARPUZ'));
  txs.forEach(t => console.log(JSON.stringify(t)));
}

checkKarpuz27June();
