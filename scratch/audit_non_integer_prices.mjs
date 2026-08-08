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
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const txs = docSnap.data().transactions || [];
  console.log(`Auditing ${txs.length} transactions for combined (fractional) buy prices...`);

  const combinedTxs = [];
  txs.forEach((t, idx) => {
    const buy = parseFloat(t.buyPrice) || 0;
    if (buy > 0) {
      // Check if buy price has a complex decimal part
      // We convert it to a string and check if it has a decimal part other than .5 or .0
      const decStr = (buy % 1).toFixed(4);
      const decVal = parseFloat(decStr);
      if (decVal !== 0 && decVal !== 0.5) {
        combinedTxs.push({ index: idx, tx: t, decimal: decVal });
      }
    }
  });

  console.log(`\nFound ${combinedTxs.length} transactions with fractional buy prices (potential combined records):`);
  
  // Group by date to see which dates have them
  const byDate = {};
  combinedTxs.forEach(c => {
    byDate[c.tx.date] = (byDate[c.tx.date] || 0) + 1;
  });
  console.log('\nPotential combined records count by date:', byDate);

  console.log('\nSamples:');
  combinedTxs.slice(0, 30).forEach(c => {
    console.log(`  Date: ${c.tx.date} | Product: "${c.tx.product}" | Hotel: ${c.tx.hotel} | Qty: ${c.tx.qty} | BuyPrice: ${c.tx.buyPrice} | SupplyPrice: ${c.tx.supplyPrice}`);
  });
}

main().catch(console.error);
