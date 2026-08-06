import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

async function swapDayMonthInDb() {
  console.log('=== FIXING SWAPPED DAY/MONTH DATES IN DB (GG.AA.YYYY STANDARD) ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  let fixedCount = 0;
  const fixedMap = {};

  transactions.forEach(t => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
      const [y, m, d] = t.date.split('-').map(Number);
      // Valid operating months are April (4) to August (8)
      // If month is outside 4..8 (e.g. 1, 2, 3, 11, 12) AND day is in 4..8, swap them!
      if ((m < 4 || m > 8) && (d >= 4 && d <= 8)) {
        const newM = String(d).padStart(2, '0');
        const newD = String(m).padStart(2, '0');
        const oldDate = t.date;
        t.date = `${y}-${newM}-${newD}`;
        fixedMap[oldDate] = t.date;
        fixedCount++;
      }
    }
  });

  console.log(`Fixed ${fixedCount} transactions where Day and Month were swapped.`);
  console.log('Sample Swapped Dates Mapping (ISO):', fixedMap);

  const uniqueIsoAfter = [...new Set(transactions.map(t => t.date))].sort();
  console.log('\nAll Unique Dates in DB After Fix (ISO):');
  console.log(uniqueIsoAfter);

  await updateDoc(docRef, {
    transactions: transactions
  });

  console.log('✅ Day and Month successfully fixed in DB!');
}

swapDayMonthInDb().catch(console.error);
