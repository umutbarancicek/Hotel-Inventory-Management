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
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.error('appData not found');
    return;
  }

  const data = docSnap.data();
  const serialized = JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(serialized, 'utf8');

  console.log(`=== appData Document Stats ===`);
  console.log(`Total Transactions: ${data.transactions?.length || 0}`);
  console.log(`Total Payments: ${data.payments?.length || 0}`);
  console.log(`Document Size in JSON format: ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(2)} KB)`);
  console.log(`Capacity Percentage (against 1MB limit): ${((sizeBytes / (1024 * 1024)) * 100).toFixed(2)}%`);
}

main().catch(console.error);
