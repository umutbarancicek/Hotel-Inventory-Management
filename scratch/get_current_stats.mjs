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

async function main() {
  const appDataRef = doc(db, 'storage', 'appData');
  const snap = await getDoc(appDataRef);
  
  if (!snap.exists()) {
    console.error('appData document not found!');
    return;
  }
  
  const txs = snap.data().transactions || [];
  
  let totalKg = 0;
  let totalAlis = 0;
  let totalTedarik = 0;
  
  txs.forEach(t => {
    const qty = t.qty || 0;
    const buyPrice = t.buyPrice || 0;
    const supplyPrice = t.supplyPrice || 0;
    
    totalKg += qty;
    totalAlis += qty * buyPrice;
    totalTedarik += qty * supplyPrice;
  });
  
  const fark = totalTedarik - totalAlis;
  
  console.log(`\n=== CURRENT DATABASE STATS ===`);
  console.log(`Total Transactions: ${txs.length}`);
  console.log(`TOTAL KG: ${totalKg.toLocaleString('tr-TR')}`);
  console.log(`TEDARIK TUTARI (Satış): ₺${totalTedarik.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`ALIS TUTARI (Hal): ₺${totalAlis.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`FARK: ₺${fark.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
}

main().catch(console.error);
