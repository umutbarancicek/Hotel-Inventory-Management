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
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const txs = docSnap.data().transactions || [];
  console.log(`Total transactions in live DB: ${txs.length}`);

  // Count occurrences of identical records (excluding the unique id)
  const counts = {};
  txs.forEach(t => {
    const key = `${t.date}|${t.supplier}|${t.product}|${t.hotel}|${t.qty}|${t.buyPrice}|${t.supplyPrice}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  let duplicateCount = 0;
  const duplicateKeys = [];
  Object.keys(counts).forEach(key => {
    if (counts[key] > 1) {
      duplicateCount += (counts[key] - 1);
      duplicateKeys.push({ key, count: counts[key] });
    }
  });

  console.log(`\nIdentical duplicates count: ${duplicateCount}`);
  console.log('Sample duplicates:');
  duplicateKeys.slice(0, 15).forEach(d => {
    console.log(`  Record: ${d.key} | Count: ${d.count}`);
  });
}

main().catch(console.error);
