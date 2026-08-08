import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

const plSnap = await getDocs(collection(db, 'priceLists'));
console.log(`Total priceLists documents in collection: ${plSnap.size}`);

let hasItemsCount = 0;
let hasPricesCount = 0;

plSnap.forEach(d => {
  const data = d.data();
  if (data.items) hasItemsCount++;
  if (data.prices) hasPricesCount++;
});

console.log(`Documents with "items" field (array format): ${hasItemsCount}`);
console.log(`Documents with "prices" field (object map format): ${hasPricesCount}`);

// Print a sample of each
const samples = [];
plSnap.forEach(d => {
  if (samples.length < 5) {
    samples.push({ id: d.id, keys: Object.keys(d.data()), sampleData: d.data() });
  }
});

console.log('\nSamples:');
samples.forEach(s => {
  console.log(`  ID: ${s.id} | Fields: ${s.keys.join(', ')}`);
  if (s.sampleData.items) {
    console.log(`    items length: ${s.sampleData.items.length}, first item:`, s.sampleData.items[0]);
  }
  if (s.sampleData.prices) {
    console.log(`    prices keys count: ${Object.keys(s.sampleData.prices).length}, sample keys:`, Object.keys(s.sampleData.prices).slice(0, 3));
  }
});
