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

async function runDeepAnalysis() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const priceLists = data.priceLists || {};
  const accounts = data.accounts || [];

  console.log('=== SYSTEM DEEP ANALYSIS ===');
  console.log(`Total Accounts: ${accounts.length}`);
  console.log(`Suppliers: ${accounts.filter(a => a.type === 'supplier').map(a => a.name).join(', ')}`);
  console.log(`Hotels: ${accounts.filter(a => a.type === 'hotel').map(a => a.name).join(', ')}`);
  
  console.log(`\nTotal Transactions: ${transactions.length}`);

  let totalQty = 0;
  let totalHal = 0;
  let totalSupply = 0;
  let supplyLessThanBuyCount = 0;
  let supplyEqualsBuyCount = 0;
  let supplyGreaterThanBuyCount = 0;
  let noTutedMatchCount = 0;

  transactions.forEach(t => {
    const qty = t.qty || 0;
    const buy = t.buyPrice || 0;
    const effSupply = (t.supplyPrice > 0) ? t.supplyPrice : buy;
    const hal = qty * buy;
    const ted = qty * effSupply;

    totalQty += qty;
    totalHal += hal;
    totalSupply += ted;

    if (t.supplyPrice > 0 && t.supplyPrice < t.buyPrice) {
      supplyLessThanBuyCount++;
    } else if (t.supplyPrice === t.buyPrice || !t.supplyPrice) {
      supplyEqualsBuyCount++;
    } else {
      supplyGreaterThanBuyCount++;
    }

    const list = priceLists[t.date] || [];
    const pMatch = list.find(p => (p.product || '').trim().toUpperCase() === (t.product || '').trim().toUpperCase());
    if (!pMatch) noTutedMatchCount++;
  });

  console.log(`\nTotals:`);
  console.log(`Total Qty: ${totalQty.toLocaleString('tr-TR')} kg`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalSupply.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark: ₺${(totalSupply - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  console.log(`\nTransaction Breakdown:`);
  console.log(`Tedarik > Alış (Kar olanlar): ${supplyGreaterThanBuyCount}`);
  console.log(`Tedarik == Alış (Başa baş olanlar / TÜTED olmayanlar): ${supplyEqualsBuyCount}`);
  console.log(`Tedarik < Alış (Zarar görünenler): ${supplyLessThanBuyCount}`);
  console.log(`TÜTED eşleşmesi olmayan işlemler: ${noTutedMatchCount}`);

  // Sample transactions where supplyPrice < buyPrice
  console.log(`\nSample transactions where Tedarik < Alış (Zarar):`);
  transactions.filter(t => t.supplyPrice > 0 && t.supplyPrice < t.buyPrice).slice(0, 5).forEach(t => {
    const list = priceLists[t.date] || [];
    const pMatch = list.find(p => (p.product || '').trim().toUpperCase() === (t.product || '').trim().toUpperCase());
    console.log(`Date: ${t.date} | Hotel: ${t.hotel} | Prod: ${t.product} | Buy: ₺${t.buyPrice} | TÜTED in List: ${pMatch ? pMatch.price : 'N/A'} | SupplyPrice: ₺${t.supplyPrice}`);
  });
}

runDeepAnalysis().catch(console.error);
