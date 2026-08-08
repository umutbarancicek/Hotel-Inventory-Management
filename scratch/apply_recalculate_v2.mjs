/**
 * RESTORE AND APPLY RECALCULATION WITH TON PRICE DETECTION
 * 
 * 1. Read transactions from the original backup (before any recalculations)
 * 2. Load all correct price lists from the priceLists Firestore collection
 * 3. Calculate supplyPrice based on TÜTED price list for that date
 * 4. Detect if transaction is in TONS (buyPrice > 2000) and scale the supplyPrice accordingly
 * 5. Update storage/appData in Firestore
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
  // Find backup file
  const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
  if (backupFiles.length === 0) {
    console.error('No backup file found!');
    return;
  }
  const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
  console.log(`Loading transactions from backup: ${backupFile}`);
  const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

  // Load correct price lists from collection
  console.log('Loading price lists from collection...');
  const plSnap = await getDocs(collection(db, 'priceLists'));
  const priceLists = {};
  plSnap.forEach(d => {
    const docData = d.data();
    priceLists[d.id] = docData.prices || docData.items || {};
  });
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

  let changed = 0, unchanged = 0, noMatch = 0;

  const updatedTxs = txs.map(tx => {
    // If it's a manual cost or transaction without product name, skip
    if (!tx.product) return tx;

    const isSpecial = CASAFORA_SEAPHORIA.has((tx.hotel || '').toUpperCase().trim());
    const marginRate = isSpecial ? 0.22 : 0.18;

    const pl = getPriceList(tx.date);
    if (!pl) { noMatch++; return tx; }

    // Resolve prices source object (it can be array items or map prices)
    let pricesObj = pl.prices;
    if (Array.isArray(pricesObj)) {
      const flat = {};
      pricesObj.forEach(p => { flat[p.product.toUpperCase().trim()] = parseFloat(String(p.price).replace(/\./g, '').replace(',', '.')); });
      pricesObj = flat;
    }

    const result = getTutedPrice(pricesObj, tx.product);
    if (!result) { noMatch++; return tx; }

    const isTon = tx.buyPrice > 2000;
    const baseSupply = Math.round(result.price * marginRate * 100) / 100;
    
    // Scale by 1000 if transaction is in tons
    const newSupplyPrice = isTon ? (baseSupply * 1000) : baseSupply;
    const oldSupplyPrice = tx.supplyPrice;

    if (Math.abs(newSupplyPrice - oldSupplyPrice) > 0.01) {
      changed++;
      return { ...tx, supplyPrice: newSupplyPrice, tuted: result.price, tutedFromDate: pl.date };
    } else {
      unchanged++;
      return tx;
    }
  });

  console.log(`\nRecalculation with Ton check result:`);
  console.log(`  Changed:   ${changed}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  No match:  ${noMatch}`);

  // Test some Karpuz/Kavun records
  console.log('\nRecalculated Karpuz/Kavun samples:');
  updatedTxs.filter(t => t.product === 'KARPUZ' || t.product === 'KAVUN').slice(0, 10).forEach(t => {
    console.log(`  Date: ${t.date} | Hotel: ${t.hotel} | Product: ${t.product} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | Recalculated SupplyPrice: ${t.supplyPrice} | TÜTED: ${t.tuted}`);
  });

  // Write to Firestore
  console.log('\nWriting to Firestore (storage/appData)...');
  const appRef = doc(db, 'storage', 'appData');
  await updateDoc(appRef, { transactions: updatedTxs });
  console.log('✅ Done! All supply prices updated in Firestore.');
}

main().catch(console.error);
