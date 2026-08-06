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

async function inspectCurrentDbDateStrings() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const txs = data.transactions || [];
  const uniqueDates = [...new Set(txs.map(t => t.date))].sort();

  console.log(`Total Unique Transaction Dates in DB: ${uniqueDates.length}`);
  console.log('Sample Unique Dates in DB:', uniqueDates.slice(0, 30));
}

inspectCurrentDbDateStrings().catch(console.error);
