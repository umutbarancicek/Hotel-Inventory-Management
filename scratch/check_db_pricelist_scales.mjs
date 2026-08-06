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

function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = String(str).replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

async function checkScales() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = data.priceLists || {};
  const dates = Object.keys(priceLists).sort();

  let smallPriceCount = 0;
  let totalCount = 0;

  dates.forEach(d => {
    priceLists[d].forEach(p => {
      totalCount++;
      const val = parsePrice(p.price);
      if (val > 0 && val < 20) {
        smallPriceCount++;
        if (smallPriceCount <= 10) {
          console.log(`Small price on ${d}: ${p.product} = ${p.price}`);
        }
      }
    });
  });

  console.log(`\nTotal price items: ${totalCount}`);
  console.log(`Items with price < 20: ${smallPriceCount}`);
}

checkScales().catch(console.error);
