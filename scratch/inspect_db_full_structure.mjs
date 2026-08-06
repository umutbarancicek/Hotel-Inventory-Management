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

async function inspectDb() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  console.log('=== ACCOUNTS IN DB ===');
  console.log(data.accounts);

  console.log('\n=== UNIQUE SUPPLIERS IN TRANSACTIONS ===');
  const txSuppliers = new Set((data.transactions || []).map(t => t.supplier));
  console.log(Array.from(txSuppliers));

  console.log('\n=== UNIQUE HOTELS IN TRANSACTIONS ===');
  const txHotels = new Set((data.transactions || []).map(t => t.hotel));
  console.log(Array.from(txHotels));
}

inspectDb().catch(console.error);
