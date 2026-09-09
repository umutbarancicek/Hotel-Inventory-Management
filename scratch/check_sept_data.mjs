import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

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

async function main() {
  const targetDate = '2026-09-08';
  const targetMonth = '2026-09';
  
  console.log(`=== Checking data for date: ${targetDate} ===\n`);

  // 1. Check monthly partitioned collection
  console.log(`--- Source 1: transactions/${targetMonth} (monthly collection) ---`);
  const monthlyRef = doc(db, 'transactions', targetMonth);
  const monthlySnap = await getDoc(monthlyRef);
  
  if (monthlySnap.exists()) {
    const items = monthlySnap.data().items || [];
    const dayItems = items.filter(t => t.date === targetDate);
    console.log(`Total items in ${targetMonth}: ${items.length}`);
    console.log(`Items on ${targetDate}: ${dayItems.length}`);
    if (dayItems.length > 0) {
      console.log('\nTransactions on 08.09.2026:');
      dayItems.forEach((t, i) => {
        console.log(`  [${i+1}] Ürün: ${t.product}, Otel: ${t.hotel}, Kilo: ${t.qty}, Alış: ${t.buyPrice}, Tedarik: ${t.supplyPrice}, ID: ${t.id}`);
      });
    } else {
      console.log(`  ⚠️  ${targetDate} tarihinde aylık koleksiyonda HİÇ VERİ YOK.`);
    }
  } else {
    console.log(`  ❌ transactions/${targetMonth} belgesi Firebase'de bulunamadı!`);
  }

  // 2. Check appData (legacy)
  console.log(`\n--- Source 2: storage/appData (legacy document) ---`);
  const appDataRef = doc(db, 'storage', 'appData');
  const appDataSnap = await getDoc(appDataRef);
  if (appDataSnap.exists()) {
    const txs = appDataSnap.data().transactions || [];
    const dayItems = txs.filter(t => t.date === targetDate);
    console.log(`Total transactions in appData: ${txs.length}`);
    console.log(`Items on ${targetDate}: ${dayItems.length}`);
    if (dayItems.length > 0) {
      console.log(`\nFound in appData on 08.09.2026:`);
      dayItems.forEach((t, i) => {
        console.log(`  [${i+1}] Ürün: ${t.product}, Otel: ${t.hotel}, Kilo: ${t.qty}, Alış: ${t.buyPrice}, ID: ${t.id}`);
      });
    } else {
      console.log(`  appData'da da ${targetDate} verisi yok.`);
    }
  } else {
    console.log(`  appData belgesi bulunamadı.`);
  }

  // 3. Check ALL monthly partitions for any September 2026 data
  console.log(`\n--- Source 3: All monthly partitions summary ---`);
  const txSnap = await getDocs(collection(db, 'transactions'));
  txSnap.forEach(d => {
    const items = d.data().items || [];
    const septItems = items.filter(t => t.date && t.date.startsWith('2026-09'));
    if (septItems.length > 0 || d.id === targetMonth) {
      console.log(`  ${d.id}: ${items.length} total items, ${septItems.length} in September 2026`);
    }
  });

  console.log('\n=== Check complete ===');
}

main().catch(console.error);
