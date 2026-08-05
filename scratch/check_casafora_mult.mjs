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

async function checkCasaforaMult() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const txs = data.transactions || [];
  const priceLists = data.priceLists || {};

  console.log('Sample CASAFORA / SEAPHORIA transactions on 2026-06-12:');
  const sample = txs.filter(t => (t.hotel === 'CASAFORA' || t.hotel === 'SEAPHORİA') && t.date === '2026-06-12').slice(0, 5);
  sample.forEach(t => {
    const list = priceLists[t.date] || [];
    const pMatch = list.find(p => p.product.trim().toUpperCase() === t.product.trim().toUpperCase());
    const tutedVal = pMatch ? parseFloat(pMatch.price) / 10 : 0;
    console.log(`Hotel: ${t.hotel} | Prod: ${t.product} | TutedVal: ${tutedVal} | SupplyPrice: ${t.supplyPrice} | Ratio vs TutedVal: ${(t.supplyPrice / (tutedVal || 1)).toFixed(2)}`);
  });
}

checkCasaforaMult();
