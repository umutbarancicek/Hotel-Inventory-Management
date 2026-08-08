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

const docSnap = await getDoc(doc(db, 'storage', 'appData'));
const data = docSnap.data();

const appDataDates = Object.keys(data.priceLists || {}).sort();
console.log('Dates in appData.priceLists:', appDataDates);

// Find closest date in appData.priceLists to 2026-06-17
const prior = appDataDates.filter(d => d <= '2026-06-17');
if (prior.length > 0) {
  const closestDate = prior[prior.length - 1];
  const list = data.priceLists[closestDate];
  console.log(`Closest prior date in appData.priceLists to 2026-06-17 is: ${closestDate}`);
  const match = list.find(p => p.product.toUpperCase() === 'KAVUN');
  console.log(`Kavun price on ${closestDate}:`, match);
} else {
  console.log('No prior date found in appData.priceLists');
}
