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

async function inspectHavuc() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceList0408 = data.priceLists['2026-08-04'] || [];
  const havucTuted = priceList0408.find(p => p.product.includes('HAVUÇ'));
  console.log('TÜTED Price List (04.08.2026) Havuç:', havucTuted);

  const txs0408 = (data.transactions || []).filter(t => t.date === '2026-08-04' && t.product.includes('HAVUÇ'));
  console.log('\nTransactions (04.08.2026) Havuç:');
  txs0408.forEach(t => {
    console.log(`Supplier: ${t.supplier} | Hotel: ${t.hotel} | Product: ${t.product} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
  });
}

inspectHavuc();
