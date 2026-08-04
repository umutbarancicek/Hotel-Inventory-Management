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

async function testGetPriceList() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const getPriceListForDate = (dateStr) => {
    if (!dateStr) return data.prices || [];
    if (!data.priceLists || Object.keys(data.priceLists).length === 0) return data.prices || [];
    
    // Try exact match
    if (data.priceLists[dateStr]) return data.priceLists[dateStr];
    
    // Try format conversion match (ISO vs DD.MM.YYYY)
    let altDate = dateStr;
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      altDate = `${d}.${m}.${y}`;
    } else if (dateStr.includes('.')) {
      const [d, m, y] = dateStr.split('.');
      altDate = `${y}-${m}-${d}`;
    }
    if (data.priceLists[altDate]) return data.priceLists[altDate];
    
    // Try finding closest available date on or before target date
    const isoTarget = dateStr.includes('.') ? dateStr.split('.').reverse().join('-') : dateStr;
    const availableDates = Object.keys(data.priceLists).map(d => {
      const iso = d.includes('.') ? d.split('.').reverse().join('-') : d;
      return { origKey: d, iso };
    }).sort((a, b) => b.iso.localeCompare(a.iso));
    
    const match = availableDates.find(d => d.iso <= isoTarget) || availableDates[0];
    if (match) return data.priceLists[match.origKey];
    
    return data.prices || [];
  };

  console.log('Available keys in priceLists:', Object.keys(data.priceLists));
  const list27 = getPriceListForDate('2026-06-27');
  console.log('Result of getPriceListForDate("2026-06-27"):', list27.find(p => p.product.includes('KARPUZ')));
}

testGetPriceList();
