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

const docSnap = await getDoc(doc(db, 'storage', 'appData'));
const data = docSnap.data();
console.log('Fields in storage/appData document:', Object.keys(data));
if (data.priceLists) {
  console.log('priceLists field exists in appData! Number of dates:', Object.keys(data.priceLists).length);
} else {
  console.log('priceLists field does NOT exist in appData.');
}
