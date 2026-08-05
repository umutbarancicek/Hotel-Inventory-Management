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

async function checkTutedScale() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const priceLists = data.priceLists || {};

  ['2026-06-01', '2026-06-11', '2026-07-21'].forEach(d => {
    const list = priceLists[d] || [];
    const item = list.find(p => p.product.includes('BİBER KALİFORNİYA') || p.product.includes('DOMATES'));
    console.log(`Date ${d}:`, item);
  });
}

checkTutedScale();
