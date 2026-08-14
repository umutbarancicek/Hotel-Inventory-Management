import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, collection, getDocs } from 'firebase/firestore';

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
  console.log('=== TEMPORARILY RESTORING TRANSACTIONS TO appData FOR SAFE TESTING ===');

  // Load all transactions from the partitioned monthly collection
  const transactions = [];
  const txSnap = await getDocs(collection(db, 'transactions'));
  txSnap.forEach(d => {
    const docData = d.data();
    if (docData.items && Array.isArray(docData.items)) {
      transactions.push(...docData.items);
    }
  });

  // Sort them
  transactions.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  console.log(`Loaded ${transactions.length} partitioned transactions.`);

  // Write them back to appData document
  const appDataRef = doc(db, 'storage', 'appData');
  await updateDoc(appDataRef, {
    transactions: transactions
  });

  console.log('✅ transactions field restored to storage/appData document.');
  console.log('Production site (old code) is now fully functional and safe.');
}

main().catch(console.error);
