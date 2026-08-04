import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

async function setFarkZeroForNoTuted() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) process.exit(1);
  const fbData = docSnap.data();

  let count = 0;
  fbData.transactions.forEach(tx => {
    if (tx.supplier === 'ERTAŞLAR' && (tx.supplyPrice === 0 || !tx.supplyPrice)) {
      tx.supplyPrice = tx.buyPrice;
      count++;
    }
  });

  console.log(`Updated ${count} transactions where TÜTED was missing -> supplyPrice set to buyPrice (Fark = 0 TL)`);
  await setDoc(docRef, fbData);
  console.log('✅ Firebase updated!');
  process.exit(0);
}

setFarkZeroForNoTuted().catch(err => console.error(err));
