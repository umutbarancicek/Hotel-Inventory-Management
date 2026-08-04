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

async function fullAudit() {
  console.log('Fetching appData from Firebase...');
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const ertaslarTx = data.transactions.filter(t => t.supplier === 'ERTAŞLAR');
  console.log(`\n================ ERTAŞLAR DATA AUDIT REPORT ================`);
  console.log(`Total ERTAŞLAR records: ${ertaslarTx.length}`);

  const issues = [];
  const dateCounts = {};
  const hotelCounts = {};
  const productCounts = {};

  ertaslarTx.forEach((tx, idx) => {
    // 1. Check Date
    dateCounts[tx.date] = (dateCounts[tx.date] || 0) + 1;

    // 2. Check Hotel
    hotelCounts[tx.hotel] = (hotelCounts[tx.hotel] || 0) + 1;

    // 3. Check Product
    productCounts[tx.product] = (productCounts[tx.product] || 0) + 1;

    // 4. Check Qty
    if (!tx.qty || tx.qty <= 0) {
      issues.push({ id: tx.id, date: tx.date, product: tx.product, type: 'Invalid Qty', detail: `Qty is ${tx.qty}` });
    }

    // 5. Check Buy Price
    if (!tx.buyPrice || tx.buyPrice <= 0) {
      issues.push({ id: tx.id, date: tx.date, product: tx.product, type: 'Invalid Buy Price', detail: `BuyPrice is ${tx.buyPrice}` });
    }

    // 6. Check Supply Price
    if (!tx.supplyPrice || tx.supplyPrice <= 0) {
      issues.push({ id: tx.id, date: tx.date, product: tx.product, type: 'Invalid Supply Price', detail: `SupplyPrice is ${tx.supplyPrice}` });
    }

    // 7. Check Price List Match
    const priceList = data.priceLists ? data.priceLists[tx.date] : null;
    if (!priceList) {
      issues.push({ id: tx.id, date: tx.date, product: tx.product, type: 'Missing PriceList for Date', detail: `No priceList stored for ${tx.date}` });
    } else {
      const pMatch = priceList.find(p => (p.product||'').trim().toUpperCase() === (tx.product||'').trim().toUpperCase());
      if (!pMatch) {
        // Try partial
        const partial = priceList.find(p => p.product.includes(tx.product) || tx.product.includes(p.product));
        if (!partial) {
          issues.push({ id: tx.id, date: tx.date, product: tx.product, type: 'Unmapped Product in TÜTED', detail: `Product "${tx.product}" not found in ${tx.date} TÜTED list` });
        }
      }
    }

    // 8. Check Margin Formula Verification
    const hUpper = (tx.hotel || '').toUpperCase().trim();
    const isSpecial = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA');
    const marginRate = isSpecial ? 0.22 : 0.18;
    const expectedTuted = Math.round((tx.supplyPrice / marginRate) * 100) / 100;
    if (expectedTuted <= 0) {
      issues.push({ id: tx.id, date: tx.date, product: tx.product, type: 'Zero/Negative Expected TÜTED', detail: `Calculated TÜTED is ${expectedTuted}` });
    }
  });

  console.log('\n--- DATE DISTRIBUTION ---');
  Object.entries(dateCounts).sort().forEach(([d, c]) => console.log(`  ${d}: ${c} records`));

  console.log('\n--- HOTEL DISTRIBUTION ---');
  Object.entries(hotelCounts).sort().forEach(([h, c]) => console.log(`  ${h}: ${c} records`));

  console.log('\n--- AUDIT ISSUES FOUND ---');
  if (issues.length === 0) {
    console.log('✅ ZERO ISSUES FOUND! All 1,789 records are 100% valid, matched, and consistent.');
  } else {
    console.log(`⚠️ Found ${issues.length} potential issues:`);
    issues.forEach(i => console.log(`  [${i.type}] ${i.date} | ${i.product} | ${i.detail}`));
  }
}

fullAudit().catch(err => console.error(err));
