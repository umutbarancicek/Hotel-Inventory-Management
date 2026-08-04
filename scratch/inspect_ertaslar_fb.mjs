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

async function inspectErtaşlar() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const ertaslarTx = data.transactions.filter(t => t.supplier === 'ERTAŞLAR');
  console.log(`Total ERTAŞLAR transactions in Firebase: ${ertaslarTx.length}`);
  
  const byHotel = {};
  ertaslarTx.forEach(t => {
    byHotel[t.hotel] = (byHotel[t.hotel] || 0) + 1;
  });
  console.log('Transactions by Hotel:', byHotel);

  const byDate = {};
  ertaslarTx.forEach(t => {
    byDate[t.date] = (byDate[t.date] || 0) + 1;
  });
  console.log('Transactions by Date:', Object.entries(byDate));

  console.log('\nFirst 5 ERTAŞLAR records:');
  ertaslarTx.slice(0, 5).forEach((t, i) => console.log(`${i+1}:`, JSON.stringify(t)));
}

inspectErtaşlar();
