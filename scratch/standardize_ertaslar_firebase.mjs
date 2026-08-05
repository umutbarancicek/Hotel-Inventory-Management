import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

const MAPPINGS = {
  'DOMATES CAM': 'DOMATES',
  'NANE TAZE': 'NANE',
  'KABAK TAZE': 'KABAK',
  'ISPANAK TAZE': 'ISPANAK',
  'BİBER DOLMALIK YEŞİL': 'BİBER DOLMA',
  'BİBER KIL SİVRİ': 'BİBER SİVRİ',
  'SALATALIK SLOR': 'SALATALIK SİLOR',
  'MARUL LOLO ROSSO KIRMIZI': 'POLOROSSO',
  'MARUL AYSBERG': 'AYSBERG',
  'PORTAKAL MEYVELİK': 'PORTAKAL MEYVELİK PAKET',
  'HAVUÇ': 'HAVUÇ BEYPAZARI',
  'ADAÇAYI TAZE': 'ADAÇAYI'
};

function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

function getMarginRate(hotelName) {
  const hUpper = (hotelName || '').toUpperCase().trim();
  if (hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA')) {
    return 0.22;
  }
  return 0.18;
}

async function runStandardization() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const priceLists = data.priceLists || {};

  let updatedCount = 0;
  const changeStats = {};

  transactions.forEach(tx => {
    const isErtaşlar = (tx.supplier || '').trim().toUpperCase().includes('ERTAŞ') || (tx.supplier || '').trim().toUpperCase().includes('ERTAS');
    if (!isErtaşlar) return;

    const currentProd = (tx.product || '').trim();
    const targetProd = MAPPINGS[currentProd];

    if (targetProd) {
      tx.product = targetProd;
      updatedCount++;
      changeStats[currentProd] = (changeStats[currentProd] || 0) + 1;
    }

    // Fix any crazy high supplyPrice (> 500 TL/kg) caused by previous script string parsing
    if (tx.supplyPrice > 500) {
      const priceList = priceLists[tx.date] || [];
      const prodClean = (tx.product || '').trim().toUpperCase();

      let pMatch = priceList.find(p => (p.product || '').trim().toUpperCase() === prodClean);
      if (pMatch) {
        let rawVal = parsePrice(pMatch.price);
        // If parsed price is ridiculously huge (> 500 TL/kg), divide by 1000 or fix decimal
        if (rawVal > 500) rawVal = rawVal / 1000;
        const marginRate = getMarginRate(tx.hotel);
        tx.supplyPrice = Math.round(rawVal * marginRate * 100) / 100;
      } else {
        tx.supplyPrice = tx.buyPrice;
      }
    }
  });

  console.log(`Updated ${updatedCount} transactions.`);
  console.log('Breakdown:', changeStats);

  // Calculate totals
  let totalAlis = 0;
  let totalTedarik = 0;
  transactions.forEach(tx => {
    const isErtaşlar = (tx.supplier || '').trim().toUpperCase().includes('ERTAŞ') || (tx.supplier || '').trim().toUpperCase().includes('ERTAS');
    if (isErtaşlar) {
      totalAlis += tx.qty * tx.buyPrice;
      const effectiveSupply = (tx.supplyPrice > 0) ? tx.supplyPrice : tx.buyPrice;
      totalTedarik += tx.qty * effectiveSupply;
    }
  });

  const totalFark = totalTedarik - totalAlis;

  console.log(`\nERTAŞLAR Totals:`);
  console.log(`Total Alış: ₺${totalAlis.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Tedarik: ₺${totalTedarik.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Fark (Kar): ₺${totalFark.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, { transactions });
  console.log('\nFirebase successfully updated!');
}

runStandardization();
