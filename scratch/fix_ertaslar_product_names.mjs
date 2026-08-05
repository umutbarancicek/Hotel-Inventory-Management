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

async function fixErtaşlarProducts() {
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

      // Recalculate supplyPrice for updated product
      const priceList = priceLists[tx.date] || [];
      const prodClean = targetProd.toUpperCase();

      let pMatch = priceList.find(p => (p.product || '').trim().toUpperCase() === prodClean);
      if (!pMatch && priceList.length > 0) {
        pMatch = priceList.find(p => {
          const pName = (p.product || '').trim().toUpperCase();
          return pName.includes(prodClean) || prodClean.includes(pName);
        });
      }

      if (pMatch) {
        const tutedVal = parsePrice(pMatch.price);
        const marginRate = getMarginRate(tx.hotel);
        tx.supplyPrice = Math.round(tutedVal * marginRate * 100) / 100;
      } else {
        // No TÜTED price for this product on this date -> strict Fark = 0 policy
        tx.supplyPrice = tx.buyPrice;
      }
    }
  });

  console.log(`Updated total ${updatedCount} transactions.`);
  console.log('Changes breakdown:', changeStats);

  // Recalculate totals
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

  console.log(`\nNew ERTAŞLAR Totals:`);
  console.log(`Total Alış: ₺${totalAlis.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Tedarik: ₺${totalTedarik.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Fark (Kar): ₺${totalFark.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, { transactions });
  console.log('\nFirebase successfully updated!');
}

fixErtaşlarProducts();
