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

async function checkAllSuppliersFormula() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const txs = data.transactions || [];
  const priceLists = data.priceLists || {};

  const suppliers = [...new Set(txs.map(t => t.supplier))];

  suppliers.forEach(sup => {
    console.log(`\n=== SUPPLIER: ${sup} ===`);
    const sample = txs.filter(t => t.supplier === sup && t.date === '2026-07-21').slice(0, 3);
    sample.forEach(t => {
      const list = priceLists[t.date] || [];
      const pMatch = list.find(p => p.product.trim().toUpperCase() === t.product.trim().toUpperCase());
      console.log(`Date: ${t.date} | Hotel: ${t.hotel} | Prod: ${t.product} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice} | TutedInList: ${pMatch ? pMatch.price : 'N/A'}`);
    });
  });
}

checkAllSuppliersFormula();
