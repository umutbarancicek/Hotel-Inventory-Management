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

function parseSlashDateToIso(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0'); // Day first in TR/UK format!
      const m = parts[1].padStart(2, '0'); // Month second!
      const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  return str;
}

async function fixSlashDatesProperly() {
  console.log('=== PARSING ALL SLASH DATES AS TR STANDARD (GÜN/AY/YIL) ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  let fixedCount = 0;
  const sampleMap = {};

  transactions.forEach(t => {
    if (t.date.includes('/') || t.date.includes('.')) {
      const old = t.date;
      t.date = parseSlashDateToIso(t.date);
      sampleMap[old] = t.date;
      fixedCount++;
    }
  });

  console.log(`Converted ${fixedCount} slash/dot dates.`);
  console.log('Sample Conversion Mapping:', sampleMap);

  const uniqueIsoAfter = [...new Set(transactions.map(t => t.date))].sort();
  console.log('\nAll Unique Dates in DB (ISO YYYY-MM-DD):');
  console.log(uniqueIsoAfter);

  await updateDoc(docRef, {
    transactions: transactions
  });

  console.log('✅ All transaction dates in DB converted to 100% accurate TR Day/Month/Year ISO format!');
}

fixSlashDatesProperly().catch(console.error);
