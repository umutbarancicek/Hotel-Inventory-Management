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

async function check03June() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  console.log('Is 2026-06-03 in priceLists?', !!priceLists['2026-06-03']);
  
  if (priceLists['2026-06-03']) {
    console.log('2026-06-03 count:', priceLists['2026-06-03'].length);
  } else {
    console.log('Available dates around 2026-06-03:');
    Object.keys(priceLists).filter(d => d.startsWith('2026-06')).forEach(d => {
      console.log(`- ${d}: ${priceLists[d].length} items`);
    });
  }
}

check03June();
