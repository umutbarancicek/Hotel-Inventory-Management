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

async function inspectHighPrices() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const transactions = data.transactions || [];
  
  const crazyRows = transactions.filter(t => t.supplyPrice > 1000 || (t.qty * t.supplyPrice) > 100000);
  console.log(`Crazy high supply price rows: ${crazyRows.length}`);

  crazyRows.slice(0, 20).forEach(t => {
    console.log(`ID: ${t.id} | Date: ${t.date} | Prod: ${t.product} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice} | Total: ${t.qty * t.supplyPrice}`);
  });
}

inspectHighPrices();
