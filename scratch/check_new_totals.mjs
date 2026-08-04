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

async function checkTotals() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const ertaslarTx = data.transactions.filter(t => t.supplier === 'ERTAŞLAR');
  
  let totalKg = 0;
  let totalAlis = 0;
  let totalTedarik = 0;

  ertaslarTx.forEach(t => {
    totalKg += t.qty;
    totalAlis += (t.qty * t.buyPrice);
    totalTedarik += (t.qty * t.supplyPrice);
  });

  console.log(`=== ERTAŞLAR NEW FIREBASE TOTALS (${ertaslarTx.length} items) ===`);
  console.log(`TOTAL KG: ${totalKg.toLocaleString('tr-TR')}`);
  console.log(`TOTAL ALIŞ TUTARI: ₺${totalAlis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`);
  console.log(`TOTAL TEDARİK TUTARI: ₺${totalTedarik.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`);
  console.log(`TOTAL FARK: ₺${(totalTedarik - totalAlis).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`);
}

checkTotals();
