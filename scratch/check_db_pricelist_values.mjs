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

async function checkPricelistValues() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const dates = Object.keys(priceLists).sort();

  console.log(`Available dates in priceLists:`, dates);

  if (dates.length > 0) {
    const targetDate = dates[0];
    console.log(`\n=== SAMPLE PRICES FOR ${targetDate} ===`);
    console.log(priceLists[targetDate].slice(0, 15));
  }
}

checkPricelistValues().catch(console.error);
