/**
 * UNMERGE ALL COMBINED TRANSACTIONS IN FIRESTORE
 * 
 * Splits the remaining 7 combined transactions into their original separate Excel rows.
 */

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

async function main() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.error('appData not found!');
    return;
  }

  const txs = docSnap.data().transactions || [];
  console.log(`Initial transactions count: ${txs.length}`);

  const updatedTxs = [];
  let splitCount = 0;

  txs.forEach(t => {
    // 1. 2026-05-04 | SALATALIK SİLOR PAKET | GRAND MİRAMOR
    if (t.date === '2026-05-04' && t.product === 'SALATALIK SİLOR PAKET' && t.hotel === 'GRAND MİRAMOR' && t.qty === 190) {
      splitCount++;
      updatedTxs.push({ ...t, qty: 50, buyPrice: 10, supplyPrice: 30.6 });
      updatedTxs.push({ ...t, id: t.id + 10001, qty: 140, buyPrice: 5, supplyPrice: 30.6 });
    }
    // 2. 2026-05-04 | DOMATES | GRAND MİRAMOR
    else if (t.date === '2026-05-04' && t.product === 'DOMATES' && t.hotel === 'GRAND MİRAMOR' && t.qty === 198) {
      splitCount++;
      updatedTxs.push({ ...t, qty: 118, buyPrice: 40, supplyPrice: 75.6 });
      updatedTxs.push({ ...t, id: t.id + 10002, qty: 80, buyPrice: 1, supplyPrice: 75.6 });
    }
    // 3. 2026-05-04 | SALATALIK SİLOR PAKET | AMBASSADOR
    else if (t.date === '2026-05-04' && t.product === 'SALATALIK SİLOR PAKET' && t.hotel === 'AMBASSADOR' && t.qty === 97) {
      splitCount++;
      updatedTxs.push({ ...t, qty: 20, buyPrice: 10, supplyPrice: 30.6 });
      updatedTxs.push({ ...t, id: t.id + 10003, qty: 77, buyPrice: 5, supplyPrice: 30.6 });
    }
    // 4. 2026-05-04 | DOMATES | AMBASSADOR
    else if (t.date === '2026-05-04' && t.product === 'DOMATES' && t.hotel === 'AMBASSADOR' && t.qty === 212) {
      splitCount++;
      updatedTxs.push({ ...t, qty: 92, buyPrice: 40, supplyPrice: 75.6 });
      updatedTxs.push({ ...t, id: t.id + 10004, qty: 120, buyPrice: 1, supplyPrice: 75.6 });
    }
    // 5. 2026-05-24 | ARMUT SANDAMARİA | CASAFORA
    else if (t.date === '2026-05-24' && t.product === 'ARMUT SANDAMARİA' && t.hotel === 'CASAFORA' && t.qty === 425) {
      splitCount++;
      updatedTxs.push({ ...t, qty: 278, buyPrice: 40, supplyPrice: 77 });
      updatedTxs.push({ ...t, id: t.id + 10005, qty: 147, buyPrice: 60, supplyPrice: 77 });
    }
    // 6. 2026-05-24 | ARMUT SANDAMARİA | SEAPHORİA
    else if (t.date === '2026-05-24' && t.product === 'ARMUT SANDAMARİA' && t.hotel === 'SEAPHORİA' && t.qty === 177) {
      splitCount++;
      updatedTxs.push({ ...t, qty: 102, buyPrice: 40, supplyPrice: 77 });
      updatedTxs.push({ ...t, id: t.id + 10006, qty: 75, buyPrice: 60, supplyPrice: 77 });
    }
    // 7. 2026-06-24 | SALATALIK SİLOR PAKET | CASAFORA
    else if (t.date === '2026-06-24' && t.product === 'SALATALIK SİLOR PAKET' && t.hotel === 'CASAFORA' && t.qty === 277) {
      splitCount++;
      updatedTxs.push({ ...t, qty: 187, buyPrice: 18, supplyPrice: 44 });
      updatedTxs.push({ ...t, id: t.id + 10007, qty: 90, buyPrice: 15, supplyPrice: 44 });
    }
    else {
      updatedTxs.push(t);
    }
  });

  console.log(`Split completed for ${splitCount} combined records.`);
  console.log(`New transactions count: ${updatedTxs.length}`);

  if (splitCount > 0) {
    await updateDoc(docRef, { transactions: updatedTxs });
    console.log('✅ Firestore updated successfully with unmerged rows!');
  } else {
    console.log('❌ No combined records matched for splitting.');
  }
}

main().catch(console.error);
