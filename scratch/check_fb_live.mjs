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

async function checkFirebaseLiveState() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const priceListKeys = data.priceLists ? Object.keys(data.priceLists) : [];
  console.log('Current priceLists keys in Firebase:', priceListKeys);
  if (priceListKeys.length > 0) {
    console.log('Sample priceList 2026-06-27 KARPUZ:', (data.priceLists['2026-06-27'] || []).find(p => p.product.includes('KARPUZ')));
  } else {
    console.log('⚠️ WARNING: priceLists is EMPTY in Firebase!');
  }
}

checkFirebaseLiveState();
