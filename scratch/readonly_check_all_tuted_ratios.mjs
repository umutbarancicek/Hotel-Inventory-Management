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

function cleanStr(str) {
  return (str || '').toString().trim().toUpperCase()
    .replace(/İ/g, 'I').replace(/I/g, 'I')
    .replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S').replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C').replace(/\s+/g, ' ');
}

async function readOnlyCheckAllTutedRatios() {
  console.log('=== PURE READ-ONLY CHECK OF ALL TRANSACTIONS (NO DB MODIFICATIONS) ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const priceLists = data.priceLists || {};

  console.log(`Analyzing ${transactions.length} total transactions in DB (READ-ONLY)...`);

  let validRatioCount = 0;
  let missingSupplyCount = 0;
  const sampleChecked = [];

  transactions.forEach((tx, idx) => {
    const hUpper = cleanStr(tx.hotel);
    const isSpecialHotel = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORIA') || hUpper.includes('CASAFORA');
    const marginRate = isSpecialHotel ? 0.22 : 0.18;

    if (tx.supplyPrice > 0) {
      const derivedTuted = Math.round((tx.supplyPrice / marginRate) * 100) / 100;
      validRatioCount++;
      if (idx < 10) {
        sampleChecked.push({
          date: tx.date,
          hotel: tx.hotel,
          prod: tx.product,
          buy: tx.buyPrice,
          supply: tx.supplyPrice,
          marginRate,
          derivedTuted
        });
      }
    } else {
      missingSupplyCount++;
    }
  });

  console.log(`\n--- READ-ONLY ANALYSIS RESULTS ---`);
  console.log(`Total Checked Transactions: ${transactions.length}`);
  console.log(`Valid Supply Price & TÜTED Ratio Transactions: ${validRatioCount} (%${((validRatioCount/transactions.length)*100).toFixed(1)})`);
  console.log(`Transactions without Supply Price: ${missingSupplyCount}`);

  console.log('\n--- SAMPLE CHECKED ROWS (FIRST 10) ---');
  sampleChecked.forEach((s, i) => {
    console.log(`${i+1}. ${s.date} | ${s.hotel} | ${s.prod} | Buy: ₺${s.buy} | Supply: ₺${s.supply} | Margin: ${s.marginRate} | Derived TÜTED (x): ₺${s.derivedTuted}`);
  });
}

readOnlyCheckAllTutedRatios().catch(console.error);
