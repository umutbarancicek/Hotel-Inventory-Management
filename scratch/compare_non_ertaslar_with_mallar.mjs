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

async function checkNonErtaşlar() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const nonErt = transactions.filter(t => t.supplier !== 'ERTAŞLAR');

  let totalKg = 0;
  let totalHal = 0;
  let totalTed = 0;

  nonErt.forEach(t => {
    totalKg += t.qty;
    totalHal += t.qty * t.buyPrice;
    totalTed += t.qty * t.supplyPrice;
  });

  console.log(`=== NON-ERTAŞLAR TRANSACTION TOTALS ===`);
  console.log(`Tx Count: ${nonErt.length}`);
  console.log(`Total Kg: ${totalKg.toLocaleString('tr-TR')} kg`);
  console.log(`Hal Maliyeti: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Tedarik Tutarı: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Net Fark (Kâr): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  console.log(`\n=== TARGET PDF REPORT (mallar.pdf) METRICS ===`);
  console.log(`Total Kg: 277.331 kg`);
  console.log(`Hal Maliyeti: ₺5.759.603,00`);
  console.log(`Tedarik Tutarı: ₺11.004.733,66`);
  console.log(`Net Fark (Kâr): ₺5.245.130,66`);
}

checkNonErtaşlar().catch(console.error);
