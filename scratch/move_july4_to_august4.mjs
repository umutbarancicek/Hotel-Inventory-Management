/**
 * MOVE TRANSACTIONS FROM 04.07 TO 04.08
 * 
 * 1. Find the 64 transactions inserted with temp IDs in range [1786100000000, 1786110000000]
 * 2. Delete them from 2026-07-04
 * 3. Re-calculate their supplyPrice using 2026-08-04 price list
 * 4. Insert them with date = '2026-08-04'
 */

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

const sourceDate = '2026-07-04';
const targetDate = '2026-08-04';
const supplier = 'MSD07 TAR ÜR';

const rawEntries = [
  { rawName: 'Şeftali', normalized: 'ŞEFTALİ', casa: 124, seaph: 52, price: 50 },
  { rawName: 'U. Elma', normalized: 'ELMA GOLDEN', casa: 115, seaph: 24, price: 55 },
  { rawName: 'Yerli Biber', normalized: 'BİBER SİVRİ', casa: 86, seaph: 29, price: 70 },
  { rawName: 'Soğan', normalized: 'SOĞAN KURU', casa: 312, seaph: 130, price: 60 },
  { rawName: 'Salatalık', normalized: 'SALATALIK SİLOR PAKET', casa: 252, seaph: 95, price: 20 },
  { rawName: 'Semizotu', normalized: 'SEMİZOTU', casa: 80, seaph: 80, price: 10 },
  { rawName: 'Sivri Biber', normalized: 'BİBER SİVRİ', casa: 0, seaph: 24, price: 70 },
  { rawName: 'Roka', normalized: 'ROKA', casa: 120, seaph: 120, price: 9 },
  { rawName: 'Patates', normalized: 'PATATES', casa: 160, seaph: 82, price: 42 },
  { rawName: 'Portakal', normalized: 'PORTAKAL SIKMALIK', casa: 122, seaph: 49, price: 25 },
  { rawName: 'Patlıcan', normalized: 'PATLICAN', casa: 66, seaph: 80, price: 20 },
  { rawName: 'Nektarin', normalized: 'NEKTARİN', casa: 50, seaph: 36, price: 50 },
  { rawName: 'Nane', normalized: 'NANE TAZE', casa: 80, seaph: 80, price: 10 },
  { rawName: 'Muz', normalized: 'MUZ YERLİ', casa: 290, seaph: 0, price: 19 },
  { rawName: 'Maydanoz', normalized: 'MAYDANOZ', casa: 80, seaph: 80, price: 9 },
  { rawName: 'Marul', normalized: 'MARUL DÜZ', casa: 21, seaph: 35, price: 20 },
  { rawName: 'Lolorosso', normalized: 'MARUL LOLO ROSSO KIRMIZI', casa: 24, seaph: 24, price: 25 },
  { rawName: 'Limon', normalized: 'LİMON', casa: 102, seaph: 90, price: 60 },
  { rawName: 'K. Lahana', normalized: 'LAHANA KIRMIZI', casa: 65, seaph: 19, price: 30 },
  { rawName: 'Kıvırcık', normalized: 'MARUL KIVIRCIK', casa: 18, seaph: 42, price: 20 },
  { rawName: 'Kayısı', normalized: 'KAYISI', casa: 109, seaph: 0, price: 50 },
  { rawName: 'Kabak', normalized: 'KABAK SAKIZ', casa: 85, seaph: 36, price: 25 },
  { rawName: 'Havuç', normalized: 'HAVUÇ', casa: 110, seaph: 30, price: 25 },
  { rawName: 'Fesleğen', normalized: 'FESLEĞEN', casa: 20, seaph: 20, price: 15 },
  { rawName: 'Erik', normalized: 'ERİK ANJELİKA', casa: 76, seaph: 42, price: 50 },
  { rawName: 'K. Elma', normalized: 'ELMA STARKING', casa: 103, seaph: 45, price: 45 },
  { rawName: 'D. Elma', normalized: 'ELMA GRANNY SMİTH', casa: 61, seaph: 43, price: 50 },
  { rawName: 'Kokteyl', normalized: 'DOMATES KOKTEYL', casa: 31, seaph: 32, price: 55 },
  { rawName: 'Dereotu', normalized: 'DEREOTU', casa: 80, seaph: 40, price: 10 },
  { rawName: 'Dolma Biber', normalized: 'BİBER DOLMA', casa: 29, seaph: 17, price: 60 },
  { rawName: 'Domates', normalized: 'DOMATES', casa: 108, seaph: 180, price: 25 },
  { rawName: 'B. Lahana', normalized: 'LAHANA', casa: 0, seaph: 36, price: 20 },
  { rawName: 'Pancar', normalized: 'PANCAR KIRMIZI', casa: 0, seaph: 20, price: 35 },
  { rawName: 'Aysberg', normalized: 'MARUL AYSBERG', casa: 0, seaph: 24, price: 25 },
  { rawName: 'Greyfurt', normalized: 'GREYFURT', casa: 55, seaph: 55, price: 30 }
];

const PRODUCT_ALIASES = {
  'DOMATES': ['DOMATES', 'DOMATES STANDART', 'DOMATES I.KAL', 'DOMATES I.KALİTE', 'SELE DOMATES'],
  'BİBER DOLMA': ['BİBER DOLMA', 'DOLMA BİBER', 'DOLMALIK BİBER', 'BİBER DOLMALIK'],
  'BİBER ÇARLİSTON': ['BİBER ÇARLİSTON', 'ÇARLİSTON BİBER', 'CHARLESTON BİBER'],
  'BİBER SİVRİ': ['BİBER SİVRİ', 'SİVRİ BİBER', 'BİBER KIL', 'BİBER KIL SİVRİ'],
  'BİBER KAPYA': ['BİBER KAPYA', 'KAPYA BİBER', 'KAPYA BİBERİ'],
  'BİBER KALİFORNİYA': ['BİBER KALİFORNİYA', 'KALİFORNİYA BİBER'],
  'PATLICAN': ['PATLICAN', 'KEMER PATLİCAN', 'YERLİ PATLİCAN'],
  'SALATALIK': ['SALATALIK', 'SALATALIK SİLOR PAKET', 'SİLOR SALATALIK', 'SALATALIK SİLOR', 'HIYAR YAYLA'],
  'SALATALIK SİLOR PAKET': ['SALATALIK SİLOR PAKET', 'SALATALIK', 'SİLOR SALATALIK', 'HIYAR YAYLA'],
  'KABAK SAKIZ': ['KABAK SAKIZ', 'KABAK', 'SAKIZ KABAK', 'YERLİ KABAK'],
  'DOMATES ÇERİ': ['DOMATES ÇERİ', 'KİRAZ DOMATES', 'CHERRY DOMATES', 'DOMATES CHERRY'],
  'DOMATES CHERRY': ['KİRAZ DOMATES', 'CHERRY DOMATES', 'DOMATES CHERRY', 'DOMATES ÇERİ'],
  'DOMATES PEMBE': ['PEMBE DOMATES', 'DOMATES PEMBE'],
  'DOMATES KOKTEYL': ['KOKTEYL DOMATES', 'DOMATES KOKTEYL'],
  'PORTAKAL SIKMALIK': ['PORTAKAL', 'SIKMALIK PORTAKAL', 'PORTAKAL SIKMALIK'],
  'ELMA GOLDEN': ['ELMA GOLDEN', 'GOLDEN ELMA', 'ELMA'],
  'ELMA STARKING': ['ELMA STARKING', 'STARKING ELMA'],
  'ELMA GRANNY SMİTH': ['ELMA GRANNY SMİTH', 'GRANNY SMITH', 'ELMA', 'ELMA GRANSİMİT'],
  'ARMUT': ['ARMUT'],
  'NEKTARİN': ['NEKTARİN', 'NEKTARIN'],
  'ŞEFTALİ': ['ŞEFTALİ', 'SEFTALİ'],
  'ERİK': ['ERİK'],
  'ERİK ANJELİKA': ['ERİK ANJELİKA', 'ERİK'],
  'KAYISI': ['KAYISI'],
  'KİRAZ': ['KİRAZ'],
  'KARPUZ': ['KARPUZ'],
  'MARUL': ['MARUL', 'MARUL DÜZ'],
  'MARUL DÜZ': ['MARUL DÜZ', 'MARUL'],
  'MARUL KIVIRCIK': ['MARUL KIVIRCIK'],
  'MARUL POLOROSSO': ['MARUL POLOROSSO', 'MARUL LOLO ROSSO KIRMIZI', 'MARUL KIRMIZI'],
  'MARUL LOLO ROSSO KIRMIZI': ['MARUL LOLO ROSSO KIRMIZI', 'MARUL POLOROSSO', 'MARUL KIRMIZI'],
  'MARUL AYSBERG': ['MARUL AYSBERG', 'MARUL'],
  'HAVUÇ': ['HAVUÇ'],
  'PATATES': ['PATATES', 'PATATES TAZE', 'PATATES BABY'],
  'PATATES BABY': ['PATATES BABY', 'PATATES'],
  'SOĞAN': ['SOĞAN', 'SOĞAN KIRMIZI', 'KIRMIZI SOĞAN'],
  'SOĞAN KIRMIZI': ['SOĞAN KIRMIZI', 'KIRMIZI SOĞAN', 'SOĞAN KURU'],
  'SOĞAN KURU': ['SOĞAN KURU', 'KURU SOĞAN', 'SOĞAN KIRMIZI'],
  'SARIMSAK KURU': ['SARIMSAK KURU', 'SARIMSAK'],
  'LAHANA': ['LAHANA', 'LAHANA BEYAZ', 'BEYAZ LAHANA', 'LAHANA KARADENİZ'],
  'LAHANA KIRMIZI': ['LAHANA KIRMIZI', 'KIRMIZI LAHANA'],
  'ÇİLEK': ['ÇİLEK'],
  'DEREOTU': ['DEREOTU', 'DERE OTU'],
  'MAYDANOZ': ['MAYDANOZ', 'MAYDONOZ', 'MAYDANOZ FRENK'],
  'NANE TAZE': ['NANE TAZE', 'NANE'],
  'ROKA': ['ROKA'],
  'SEMİZOTU': ['SEMİZOTU', 'SEMİZ OTU'],
  'TERE': ['TERE'],
  'FESLEĞEN': ['FESLEĞEN'],
  'KUZU KULAĞI': ['KUZU KULAĞI', 'KUZU KULAGI'],
  'PIRASA': ['PIRASA'],
  'TURP': ['TURP'],
  'PANCAR KIRMIZI': ['PANCAR KIRMIZI', 'KIRMIZI PANCAR', 'PANCAR'],
  'LİMON': ['LİMON'],
  'MUZ YERLİ': ['MUZ YERLİ', 'MUZ'],
};

function getTutedPrice(prices, productName) {
  const searchKey = productName.toUpperCase().trim();
  if (prices[searchKey] !== undefined) return prices[searchKey];
  const variants = PRODUCT_ALIASES[searchKey] || [searchKey];
  for (const variant of variants) {
    if (prices[variant] !== undefined) return prices[variant];
    const matchKey = Object.keys(prices).find(k => k.includes(variant) || variant.includes(k));
    if (matchKey) return prices[matchKey];
  }
  return null;
}

async function main() {
  console.log('Fetching target price list for 2026-08-04...');
  const priceListSnap = await getDoc(doc(db, 'priceLists', '2026-08-04'));
  if (!priceListSnap.exists()) {
    console.error('2026-08-04 price list not found! Cannot calculate target supply prices.');
    return;
  }
  const targetTutedPrices = priceListSnap.data().prices || {};

  console.log('Loading appData...');
  const appDataRef = doc(db, 'storage', 'appData');
  const appDataSnap = await getDoc(appDataRef);
  if (!appDataSnap.exists()) {
    console.error('appData not found!');
    return;
  }
  const appData = appDataSnap.data();
  const txs = appData.transactions || [];

  // 1. Identify and remove July 4th temporary transactions
  // Filter out any transaction with date '2026-07-04' and supplier 'MSD07 TAR ÜR'
  // that has an ID in the Javascript timestamp range (e.g., between 1786100000000 and 1786110000000)
  const cleanedTxs = txs.filter(t => {
    const isTempInserted = (
      t.date === sourceDate && 
      t.supplier === supplier && 
      t.id >= 1786100000000 && 
      t.id <= 1786110000000
    );
    return !isTempInserted;
  });

  const removedCount = txs.length - cleanedTxs.length;
  console.log(`Successfully removed ${removedCount} temporary July 4th transactions.`);

  // 2. Generate correct transactions for August 4th
  const newTransactions = [];
  let idBase = Date.now();

  rawEntries.forEach(entry => {
    const tutedVal = getTutedPrice(targetTutedPrices, entry.normalized);
    if (tutedVal === null) {
      console.log(`⚠️ Warning: No TÜTED price on 2026-08-04 for ${entry.normalized}. Will use unit buyPrice.`);
    }

    // Casafora
    if (entry.casa > 0) {
      const useTuted = tutedVal !== null ? tutedVal : entry.price;
      const supplyPrice = Math.round(useTuted * 0.22 * 100) / 100;
      newTransactions.push({
        id: idBase++,
        date: targetDate,
        supplier,
        hotel: 'CASAFORA',
        product: entry.normalized,
        qty: entry.casa,
        buyPrice: entry.price,
        supplyPrice,
        ...(tutedVal !== null ? { tuted: tutedVal, tutedFromDate: '2026-08-04' } : { tutedMissing: true })
      });
    }

    // Seaphoria
    if (entry.seaph > 0) {
      const useTuted = tutedVal !== null ? tutedVal : entry.price;
      const supplyPrice = Math.round(useTuted * 0.22 * 100) / 100;
      newTransactions.push({
        id: idBase++,
        date: targetDate,
        supplier,
        hotel: 'SEAPHORİA',
        product: entry.normalized,
        qty: entry.seaph,
        buyPrice: entry.price,
        supplyPrice,
        ...(tutedVal !== null ? { tuted: tutedVal, tutedFromDate: '2026-08-04' } : { tutedMissing: true })
      });
    }
  });

  console.log(`Generated ${newTransactions.length} new transactions for 04.08.2026.`);

  // Combine
  const updatedTxs = [...cleanedTxs, ...newTransactions];

  const payloadSizeKB = Math.round(JSON.stringify(updatedTxs).length / 1024);
  console.log(`Total transactions count: ${updatedTxs.length} | Payload: ~${payloadSizeKB} KB`);

  if (payloadSizeKB > 900) {
    console.error('❌ Error: Payload exceeds size limit.');
    return;
  }

  // Update in Firestore
  await updateDoc(appDataRef, { transactions: updatedTxs });
  console.log('✅ Success: Transactions moved to 04.08.2026 and re-calculated successfully!');
}

main().catch(console.error);
