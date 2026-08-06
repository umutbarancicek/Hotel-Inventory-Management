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

function normalizeIsoDate(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      let p0 = parseInt(parts[0]);
      let p1 = parseInt(parts[1]);
      let y = parts[2].length === 2 ? '20' + parts[2] : parts[2];

      let d, m;
      if (p0 > 12) {
        d = String(p0).padStart(2, '0');
        m = String(p1).padStart(2, '0');
      } else {
        d = String(p1).padStart(2, '0');
        m = String(p0).padStart(2, '0');
      }
      return `${y}-${m}-${d}`;
    }
  }

  return str;
}

async function fixAllDbDateFormats() {
  console.log('=== FIXING AND NORMALIZING ALL TRANSACTION DATES IN DB ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];

  let fixedCount = 0;
  const malformedBefore = [];

  transactions.forEach(t => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
      malformedBefore.push(t.date);
      t.date = normalizeIsoDate(t.date);
      fixedCount++;
    }
  });

  console.log(`Found ${malformedBefore.length} non-ISO dates before fix.`);
  console.log('Sample malformed dates:', [...new Set(malformedBefore)].slice(0, 10));
  console.log(`Normalized ${fixedCount} transaction date fields.`);

  await updateDoc(docRef, {
    transactions: transactions
  });

  console.log('✅ All transaction dates in DB successfully normalized to standard YYYY-MM-DD format!');
}

fixAllDbDateFormats().catch(console.error);
