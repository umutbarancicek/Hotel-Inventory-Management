// Firestore'daki 2026-07-07 price list'in içeriğini göster
// Ertaşlar'ın 07 Temmuz'da kullandığı ürün adlarıyla karşılaştır
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

for (const dateISO of ['2026-07-07', '2026-07-09', '2026-07-10', '2026-07-21']) {
  const d = await getDoc(doc(db, 'priceLists', dateISO));
  const prices = d.data()?.prices || {};
  const keys = Object.keys(prices).sort();
  console.log(`\n${dateISO}: ${keys.length} products`);
  keys.forEach(k => console.log(`  "${k}": ${prices[k]}`));
}
