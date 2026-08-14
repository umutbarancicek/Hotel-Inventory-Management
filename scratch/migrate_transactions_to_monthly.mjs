import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteField } from 'firebase/firestore';

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
  console.log('=== STARTING TRANSACTIONS PARTITION MIGRATION ===');

  const appDataRef = doc(db, 'storage', 'appData');
  const appDataSnap = await getDoc(appDataRef);
  if (!appDataSnap.exists()) {
    console.error('appData document not found!');
    return;
  }

  const appData = appDataSnap.data();
  const transactions = appData.transactions || [];
  console.log(`Loaded ${transactions.length} transactions from appData document.`);

  if (transactions.length === 0) {
    console.log('No transactions found in appData. Checking if already migrated...');
    const txSnap = await getDocs(collection(db, 'transactions'));
    console.log(`Found ${txSnap.size} monthly documents in 'transactions' collection.`);
    return;
  }

  // Partition transactions by YYYY-MM
  const partitions = {};
  transactions.forEach(tx => {
    const dateStr = tx.date || '';
    let yearMonth = 'unknown';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      yearMonth = dateStr.slice(0, 7); // e.g. "2026-05"
    }
    if (!partitions[yearMonth]) partitions[yearMonth] = [];
    partitions[yearMonth].push(tx);
  });

  console.log('\nPartitions detected:');
  for (const [ym, items] of Object.entries(partitions)) {
    console.log(`  Month: ${ym} | Count: ${items.length}`);
  }

  // Write partitions to the 'transactions' collection
  console.log('\nSaving monthly documents to Firestore...');
  for (const [ym, items] of Object.entries(partitions)) {
    const monthlyRef = doc(db, 'transactions', ym);
    await setDoc(monthlyRef, { items });
    console.log(`  Saved: transactions/${ym}`);
  }

  // Remove the transactions field from appData document to clear space
  console.log('\nRemoving transactions field from storage/appData...');
  await updateDoc(appDataRef, {
    transactions: deleteField()
  });
  console.log('✅ transactions field deleted from storage/appData.');

  console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
}

main().catch(console.error);
