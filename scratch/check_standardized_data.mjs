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

const docSnap = await getDoc(doc(db, 'priceLists', '2026-04-24'));
if (docSnap.exists()) {
  const data = docSnap.data();
  console.log('Document metadata:', { date: data.date, source: data.source, sourceDate: data.sourceDate });
  console.log('Items array length:', data.items ? data.items.length : 'undefined');
  
  if (data.items) {
    console.log('\nMatching items containing BERRY, AHUDUDU, MİNİ, or ÇİLEK:');
    data.items.forEach(item => {
      const upper = item.product.toUpperCase();
      if (upper.includes('BERRY') || upper.includes('AHUDUDU') || upper.includes('MİNİ') || upper.includes('ÇİLEK') || upper.includes('BÖĞÜRTLEN')) {
        console.log(`  Product: "${item.product}" | Unit: "${item.unit}" | Price: ${item.price}`);
      }
    });
  }
} else {
  console.log('2026-04-24 not found.');
}
