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

async function check01June() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const list01 = data.priceLists['2026-06-01'] || [];
  console.log('01.06.2026 TÜTED Prices:');
  const cilek = list01.find(p => p.product.includes('ÇİLEK'));
  const muz = list01.find(p => p.product.includes('MUZ'));

  console.log('Çilek in 01.06.2026:', cilek);
  console.log('Muz in 01.06.2026:', muz);
}

check01June();
