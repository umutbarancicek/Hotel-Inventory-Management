/**
 * SPLIT NEKTARİN ON 11.07.2026
 * 
 * Split the combined Nektarin transaction (Qty: 161, Buy: 23.11) on 2026-07-11 into:
 * 1. Qty: 37 | BuyPrice: 0 | SupplyPrice: 75.6
 * 2. Qty: 124 | BuyPrice: 30 | SupplyPrice: 75.6
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
  let splitDone = false;

  txs.forEach(t => {
    if (t.date === '2026-07-11' && t.product === 'NEKTARİN' && t.hotel === 'AMBASSADOR' && t.qty === 161 && t.buyPrice === 23.11) {
      splitDone = true;
      console.log('Found Nektarin transaction to split:', t);
      
      // Split into two
      updatedTxs.push({
        ...t,
        qty: 37,
        buyPrice: 0,
        supplyPrice: 75.6
      });
      updatedTxs.push({
        ...t,
        id: t.id + 8888, // Unique ID
        qty: 124,
        buyPrice: 30,
        supplyPrice: 75.6
      });
    } else {
      updatedTxs.push(t);
    }
  });

  if (splitDone) {
    console.log(`Splitting completed. New transactions count: ${updatedTxs.length}`);
    await updateDoc(docRef, { transactions: updatedTxs });
    console.log('✅ Firestore updated successfully!');
  } else {
    console.log('❌ Target Nektarin transaction not found in live database (maybe already split or different fields).');
  }
}

main().catch(console.error);
