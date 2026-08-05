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

function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

async function findHuge() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const transactions = data.transactions || [];

  console.log('=== CHECKING HUGE PRICES IN PRICELISTS ===');
  Object.keys(priceLists).forEach(d => {
    priceLists[d].forEach(item => {
      const val = parsePrice(item.price);
      if (val > 3000) {
        console.log(`Date: ${d} | Prod: ${item.product} | StoredPrice: ${item.price}`);
      }
    });
  });

  console.log('\n=== CHECKING HUGE SUPPLY PRICES IN TRANSACTIONS ===');
  transactions.forEach(t => {
    if (t.supplyPrice > 500) {
      console.log(`Date: ${t.date} | Hotel: ${t.hotel} | Prod: ${t.product} | Qty: ${t.qty} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice}`);
    }
  });
}

findHuge();
