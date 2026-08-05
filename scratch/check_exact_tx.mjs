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

async function checkExactTx() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const transactions = data.transactions || [];

  const t1 = transactions.find(t => String(t.id) === '1785700000425');
  const t2 = transactions.find(t => String(t.id) === '1532');

  console.log('Transaction 1785700000425:');
  console.log(t1);

  console.log('\nTransaction 1532:');
  console.log(t2);
}

checkExactTx();
