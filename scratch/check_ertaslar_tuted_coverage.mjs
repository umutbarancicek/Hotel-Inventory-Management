import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocs, collection } from 'firebase/firestore';

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

async function run() {
  const snap = await getDocs(collection(db, 'priceLists'));
  const dates = [];
  snap.forEach(doc => dates.push(doc.id));
  dates.sort();
  console.log(`Price lists in Firestore (${dates.length}):`);
  dates.forEach(d => console.log(`  ${d}`));
  
  // Ertaşlar dates that need TÜTED:
  const ertaslarDates = [
    '2026-04-30','2026-05-01','2026-05-06','2026-05-09','2026-05-12',
    '2026-05-31','2026-06-01','2026-06-11','2026-06-12','2026-06-13',
    '2026-06-14','2026-06-27','2026-07-01','2026-07-07','2026-07-09',
    '2026-07-10','2026-07-21','2026-07-22','2026-07-23','2026-07-25','2026-07-27'
  ];
  
  console.log('\nErtaşlar dates vs available price lists:');
  ertaslarDates.forEach(d => {
    const hasExact = dates.includes(d);
    const priorDates = dates.filter(x => x <= d);
    const closest = priorDates.length > 0 ? priorDates[priorDates.length - 1] : null;
    console.log(`  ${d} → exact: ${hasExact ? '✅' : '❌'} | fallback to: ${closest || 'NONE'}`);
  });
}

run().catch(console.error);
