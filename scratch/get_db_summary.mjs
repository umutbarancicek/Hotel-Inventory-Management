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

async function getSummary() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];

  let totalKg = 0;
  let totalHal = 0;
  let totalTed = 0;

  const supplierBreakdown = {};
  const hotelBreakdown = {};

  transactions.forEach(t => {
    totalKg += t.qty;
    const hal = t.qty * t.buyPrice;
    
    // Standard hotels: 0.18, Special hotels (Seaphoria, Casafora): 0.22
    const hUpper = (t.hotel || '').trim().toUpperCase();
    const isSpecialHotel = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORIA') || hUpper.includes('CASAFORA');
    const marginRate = isSpecialHotel ? 0.22 : 0.18;
    
    // For transactions, let's see what is stored in supplyPrice
    // If it is 0 or undefined, fallback to buyPrice
    const effectiveSupplyPrice = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    const ted = t.qty * effectiveSupplyPrice;

    totalHal += hal;
    totalTed += ted;

    if (!supplierBreakdown[t.supplier]) {
      supplierBreakdown[t.supplier] = { kg: 0, hal: 0 };
    }
    supplierBreakdown[t.supplier].kg += t.qty;
    supplierBreakdown[t.supplier].hal += hal;

    if (!hotelBreakdown[t.hotel]) {
      hotelBreakdown[t.hotel] = { kg: 0, ted: 0 };
    }
    hotelBreakdown[t.hotel].kg += t.qty;
    hotelBreakdown[t.hotel].ted += ted;
  });

  console.log(`=== DATABASE SUMMARY ===`);
  console.log(`Toplam İşlem Sayısı (Transactions): ${transactions.length}`);
  console.log(`Toplam Kilo (Kg): ${totalKg.toLocaleString('tr-TR')} kg`);
  console.log(`Toplam Hal Maliyeti (Alış): ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Toplam Tedarik Tutarı: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Net Fark (Kâr): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  console.log(`\n=== MÜSTAHSİL BAZLI DAĞILIM ===`);
  Object.keys(supplierBreakdown).sort().forEach(sup => {
    const info = supplierBreakdown[sup];
    console.log(`- ${sup}: ${info.kg.toLocaleString('tr-TR')} kg | Hal Maliyeti: ₺${info.hal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  });

  console.log(`\n=== OTEL BAZLI DAĞILIM ===`);
  Object.keys(hotelBreakdown).sort().forEach(hot => {
    const info = hotelBreakdown[hot];
    console.log(`- ${hot}: ${info.kg.toLocaleString('tr-TR')} kg | Tedarik Tutarı: ₺${info.ted.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  });
}

getSummary().catch(console.error);
