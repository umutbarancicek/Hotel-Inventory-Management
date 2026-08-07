import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';

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

async function migrate() {
  console.log('=== MIGRATING PRICELISTS TO SUBCOLLECTION ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const dates = Object.keys(priceLists);

  console.log(`Found ${dates.length} price lists in appData document.`);

  for (const date of dates) {
    const prices = priceLists[date];
    const plistDocRef = doc(db, 'priceLists', date);
    console.log(`Saving price list for ${date} as separate document...`);
    await setDoc(plistDocRef, { items: prices });
  }

  console.log('Deleting priceLists field from appData document...');
  delete data.priceLists;

  const jsonStr = JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');
  console.log(`New appData document size: ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(2)} KB)`);

  await setDoc(docRef, data);
  console.log('✅ Migration complete and appData document updated!');
}

migrate().catch(console.error);
