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

const snap = await getDoc(doc(db, 'storage', 'appData'));
const txs = snap.data().transactions || [];
console.log('Total transactions in DB:', txs.length);

const timestampTxs = txs.filter(t => t.id > 1786000000000 && !t.id.toString().startsWith('17862') && !t.id.toString().startsWith('17860'));
console.log(`Found ${timestampTxs.length} timestamp transactions:`);
if (timestampTxs.length > 0) {
  console.log('Sample:', timestampTxs[0]);
  console.log('All IDs:', timestampTxs.map(t => t.id));
}
