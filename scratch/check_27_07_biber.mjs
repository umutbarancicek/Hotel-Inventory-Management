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

async function check2707Biber() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const priceList = data.priceLists['2026-07-27'] || [];
  const biber = priceList.find(p => p.product.includes('KALİFORNİYA'));

  console.log('27.07.2026 BİBER KALİFORNİYA in priceLists:');
  console.log(biber);

  console.log('\nSample transactions for 27.07.2026 with BİBER KALİFORNİYA:');
  const txs = (data.transactions || []).filter(t => t.date === '2026-07-27' && t.product.includes('KALİFORNİYA'));
  txs.forEach(t => {
    console.log(`ID: ${t.id} | Hotel: ${t.hotel} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice}`);
  });
}

check2707Biber();
