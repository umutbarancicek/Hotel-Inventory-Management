/**
 * APPLY supply price recalculation with TÜTED prices
 * 1. Backup current data to JSON
 * 2. Recalculate all supplyPrices
 * 3. Write to Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

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

const CASAFORA_SEAPHORIA = new Set(['CASAFORA', 'SEAPHORİA', 'SEAPHORIA']);

const PRODUCT_ALIASES = {
  'DOMATES': ['DOMATES', 'DOMATES STANDART', 'DOMATES I.KAL', 'SELE DOMATES', 'DOMATES BEEF'],
  'DOMATES KOKTEYL': ['DOMATES KOKTEYL', 'KOKTEYL DOMATES'],
  'DOMATES CHERRY': ['DOMATES CHERRY', 'KİRAZ DOMATES', 'DOMATES ÇERİ'],
  'BİBER DOLMA': ['BİBER DOLMA', 'DOLMA BİBER', 'DOLMALIK BİBER', 'BİBER DOLMALIK'],
  'BİBER ÇARLİSTON': ['BİBER ÇARLİSTON', 'ÇARLİSTON BİBER'],
  'BİBER SİVRİ': ['BİBER SİVRİ', 'SİVRİ BİBER', 'BİBER KIL'],
  'BİBER KAPYA': ['BİBER KAPYA', 'KAPYA BİBER'],
  'BİBER KALİFORNİYA': ['BİBER KALİFORNİYA', 'KALİFORNİYA BİBER'],
  'PATLICAN': ['PATLICAN', 'KEMER PATLİCAN', 'PATLICAN BOSTAN'],
  'SALATALIK SİLOR PAKET': ['SALATALIK SİLOR PAKET', 'SALATALIK', 'SİLOR SALATALIK', 'HIYAR YAYLA'],
  'KABAK SAKIZ': ['KABAK SAKIZ', 'KABAK', 'SAKIZ KABAK', 'KABAK BAL DEKORLU'],
  'PORTAKAL SIKMALIK': ['PORTAKAL SIKMALIK', 'PORTAKAL', 'SIKMALIK PORTAKAL', 'PORTAKAL MEYVELİK PAKET'],
  'ELMA GOLDEN': ['ELMA GOLDEN', 'GOLDEN ELMA'],
  'ELMA STARKING': ['ELMA STARKING', 'STARKING ELMA'],
  'ELMA GRANNY SMİTH': ['ELMA GRANNY SMİTH', 'GRANNY SMITH', 'ELMA GRANSİMİT'],
  'NEKTARİN': ['NEKTARİN', 'NEKTARIN'],
  'ŞEFTALİ': ['ŞEFTALİ', 'SEFTALİ'],
  'ERİK ANJELİKA': ['ERİK ANJELİKA', 'ERİK'],
  'ERİK PAPAZ': ['ERİK PAPAZ', 'PAPAZ ERİĞİ'],
  'MARUL DÜZ': ['MARUL DÜZ', 'MARUL'],
  'MARUL LOLO ROSSO KIRMIZI': ['MARUL LOLO ROSSO KIRMIZI', 'LOLOROSSO', 'MARUL POLOROSSO', 'LOLO ROSSO', 'POLOROSSO'],
  'MARUL AYSBERG': ['MARUL AYSBERG', 'AYSBERG MARUL', 'MARUL ICEBERG'],
  'MARUL KIVIRCIK': ['MARUL KIVIRCIK', 'KIVIRCIK MARUL'],
  'HAVUÇ': ['HAVUÇ', 'HAVUÇ BEYPAZARI'],
  'HAVUÇ BEYPAZARI': ['HAVUÇ BEYPAZARI', 'HAVUÇ'],
  'PATATES': ['PATATES', 'PATATES TAZE', 'PATATES KUMPİR'],
  'PATATES TAZE': ['PATATES TAZE', 'PATATES'],
  'PATATES BABY': ['PATATES BABY', 'PATATES'],
  'SOĞAN KURU': ['SOĞAN KURU', 'KURU SOĞAN'],
  'SOĞAN KIRMIZI': ['SOĞAN KIRMIZI', 'KIRMIZI SOĞAN'],
  'SOĞAN TAZE': ['SOĞAN TAZE', 'TAZE SOĞAN'],
  'SOĞAN ARPACIK': ['SOĞAN ARPACIK', 'ARPACIK SOĞAN'],
  'LAHANA': ['LAHANA', 'LAHANA BEYAZ', 'LAHANA KARADENİZ'],
  'LAHANA KIRMIZI': ['LAHANA KIRMIZI', 'KIRMIZI LAHANA'],
  'DEREOTU': ['DEREOTU', 'DERE OTU'],
  'MAYDANOZ': ['MAYDANOZ', 'MAYDONOZ'],
  'MAYDANOZ FRENK': ['MAYDANOZ FRENK', 'MAYDANOZ', 'MAYDONOZ'],
  'NANE TAZE': ['NANE TAZE', 'NANE'],
  'NANE': ['NANE', 'NANE TAZE'],
  'ROKA': ['ROKA'],
  'SEMİZOTU': ['SEMİZOTU', 'SEMİZ OTU'],
  'PANCAR KIRMIZI': ['PANCAR KIRMIZI', 'KIRMIZI PANCAR', 'PANCAR'],
  'LİMON': ['LİMON'],
  'LİMON LİME': ['LİMON LİME', 'LİME LİMON'],
  'MUZ YERLİ': ['MUZ YERLİ', 'MUZ'],
  'MUZ İTHAL': ['MUZ İTHAL', 'MUZ'],
  'GREYFURT': ['GREYFURT'],
  'KİRAZ': ['KİRAZ'],
  'KAYISI': ['KAYISI'],
  'ÇİLEK': ['ÇİLEK'],
  'KARPUZ': ['KARPUZ'],
  'KAVUN': ['KAVUN'],
  'FESLEĞEN': ['FESLEĞEN', 'FESLEĞEN PAKET', 'FESLEĞEN KIRMIZI'],
  'MANTAR TAZE': ['MANTAR TAZE', 'MANTAR'],
  'SARIMSAK KURU': ['SARIMSAK KURU', 'SARIMSAK'],
  'TURP JAPON': ['TURP JAPON', 'TURP'],
  'TURP KIRMIZI': ['TURP KIRMIZI', 'TURP'],
  'BROKOLİ': ['BROKOLİ'],
  'FASULYE': ['FASULYE'],
  'ISPANAK': ['ISPANAK'],
  'KEREVIZ': ['KEREVIZ', 'KEREVİZ', 'KEREVİZ SAP'],
  'PIRASA': ['PIRASA'],
  'KARNABAH': ['KARNABAH', 'KARNABAHI'],
};

function getTutedPrice(prices, productName) {
  const key = productName.toUpperCase().trim();
  if (prices[key] !== undefined) return { price: prices[key], matched: key };

  const variants = PRODUCT_ALIASES[key] || [key];
  for (const v of variants) {
    if (prices[v] !== undefined) return { price: prices[v], matched: v };
  }

  // Fuzzy: partial match
  const priceKeys = Object.keys(prices);
  for (const v of variants) {
    const match = priceKeys.find(k => k === v || k.startsWith(v) || v.startsWith(k));
    if (match) return { price: prices[match], matched: match };
  }

  return null;
}

async function main() {
  // Load transactions
  console.log('Loading transactions...');
  const appRef = doc(db, 'storage', 'appData');
  const appSnap = await getDoc(appRef);
  const txs = appSnap.data().transactions || [];
  console.log(`Loaded ${txs.length} transactions`);

  // Backup
  const backupPath = `scratch/backup_before_recalc_${Date.now()}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(txs, null, 2), 'utf-8');
  console.log(`✅ Backup saved to: ${backupPath}`);

  // Load all price lists
  console.log('Loading price lists...');
  const plSnap = await getDocs(collection(db, 'priceLists'));
  const priceLists = {};
  plSnap.forEach(d => { priceLists[d.id] = d.data().prices || {}; });
  const sortedDates = Object.keys(priceLists).sort();
  console.log(`Loaded ${sortedDates.length} price lists`);

  function getPriceList(date) {
    if (priceLists[date]) return { date, prices: priceLists[date] };
    const prior = sortedDates.filter(d => d <= date);
    if (prior.length > 0) {
      const d = prior[prior.length - 1];
      return { date: d, prices: priceLists[d] };
    }
    return null;
  }

  // Recalculate
  let changed = 0, unchanged = 0, noMatch = 0;

  const updatedTxs = txs.map(tx => {
    const isSpecial = CASAFORA_SEAPHORIA.has((tx.hotel || '').toUpperCase());
    const marginRate = isSpecial ? 0.22 : 0.18;

    const pl = getPriceList(tx.date);
    if (!pl) { noMatch++; return tx; }

    const result = getTutedPrice(pl.prices, tx.product);
    if (!result) { noMatch++; return tx; }

    const newSupplyPrice = Math.round(result.price * marginRate * 100) / 100;
    const oldSupplyPrice = tx.supplyPrice;

    if (Math.abs(newSupplyPrice - oldSupplyPrice) > 0.01) {
      changed++;
      return { ...tx, supplyPrice: newSupplyPrice, tuted: result.price, tutedFromDate: pl.date };
    } else {
      unchanged++;
      return tx;
    }
  });

  console.log(`\nRecalculation result:`);
  console.log(`  Changed:   ${changed}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  No match:  ${noMatch}`);

  // Size check
  const payload = JSON.stringify(updatedTxs);
  const sizeKB = Math.round(payload.length / 1024);
  console.log(`  Payload:   ~${sizeKB} KB`);

  if (sizeKB > 900) {
    console.error('❌ Payload too large! Aborting.');
    return;
  }

  // Write to Firestore
  console.log('\nWriting to Firestore...');
  await updateDoc(appRef, { transactions: updatedTxs });
  console.log('✅ Done! All supply prices updated.');
  console.log(`\n💾 Backup file if you need to rollback: ${backupPath}`);
}

main().catch(console.error);
