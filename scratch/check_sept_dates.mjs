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
  const targetMonth = '2026-09';
  
  const monthlyRef = doc(db, 'transactions', targetMonth);
  const monthlySnap = await getDoc(monthlyRef);
  
  if (!monthlySnap.exists()) {
    console.log('No September 2026 document found.');
    return;
  }

  const items = monthlySnap.data().items || [];
  
  // Group by date
  const byDate = {};
  items.forEach(t => {
    const d = t.date || 'unknown';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(t);
  });

  console.log(`=== Eylül 2026 - Mevcut Günler (${items.length} toplam işlem) ===\n`);
  const sortedDates = Object.keys(byDate).sort();
  sortedDates.forEach(date => {
    console.log(`  ${date}: ${byDate[date].length} işlem`);
  });

  console.log(`\n=== En son işlemler (son 15 kayıt) ===`);
  const sorted = [...items].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || 0) - (a.id || 0));
  sorted.slice(0, 15).forEach((t, i) => {
    console.log(`  [${i+1}] ${t.date} | ${t.product} | ${t.hotel} | ${t.qty} kg | Alış: ${t.buyPrice} | ID: ${t.id}`);
  });
}

main().catch(console.error);
