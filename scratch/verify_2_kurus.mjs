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

async function check2Kurus() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const txs = data.transactions.filter(t => (t.supplier || '').trim().toUpperCase().includes('ERTAŞ') || (t.supplier || '').trim().toUpperCase().includes('ERTAS'));

  let siteHalTotal = 0;
  txs.forEach(t => {
    siteHalTotal += (t.qty * t.buyPrice);
  });

  const p1 = txs.find(t => t.product === 'PANCAR KIRMIZI' && t.qty === 45 && t.buyPrice === 30.5);
  const t1 = txs.find(t => (t.product === 'TURP JAPON' || t.product === 'TURP') && t.qty === 35 && t.buyPrice === 39.5);

  console.log(`Current Site Total: ₺${siteHalTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Excel Col 5 Target: ₺3.017.505,02`);
  console.log(`Difference: ₺${(3017505.02 - siteHalTotal).toFixed(2)} TL`);

  console.log('\nRow 994 (PANCAR KIRMIZI):', p1);
  console.log('Row 1013 (TURP JAPON):', t1);
}

check2Kurus();
