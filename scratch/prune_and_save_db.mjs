import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

async function prune() {
  console.log('=== PRUNING PRICELISTS TO STAY UNDER 1MB LIMIT ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const priceLists = data.priceLists || {};

  const txDates = new Set(transactions.map(t => t.date));
  console.log(`Unique dates in transactions: ${txDates.size}`);
  console.log(`Total dates in priceLists currently: ${Object.keys(priceLists).length}`);

  // Keep price lists ONLY for dates that have transactions OR the latest date (August 6, 2026)
  const prunedPriceLists = {};
  let keptCount = 0;
  let prunedCount = 0;

  Object.keys(priceLists).forEach(d => {
    if (txDates.has(d) || d === '2026-08-06') {
      prunedPriceLists[d] = priceLists[d];
      keptCount++;
    } else {
      prunedCount++;
    }
  });

  console.log(`Keeping ${keptCount} price lists. Pruning ${prunedCount} unused price lists.`);

  data.priceLists = prunedPriceLists;

  const jsonStr = JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');
  console.log(`New document size: ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(2)} KB)`);

  if (sizeBytes < 1048576) {
    console.log('✅ Size is under 1MB! Attempting to write to Firestore...');
    await setDoc(docRef, data);
    console.log('✅ Document successfully written to Firestore!');
  } else {
    console.log('❌ Size is STILL over 1MB!');
  }
}

prune().catch(console.error);
