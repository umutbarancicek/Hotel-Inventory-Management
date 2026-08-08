/**
 * APPLY FINAL RECALCULATION & STANDARDIZATION (V3)
 * 
 * 1. Load clean transactions from the backup JSON.
 * 2. Convert all Karpuz/Kavun ton transactions to kilograms.
 * 3. Split June 17 Karpuz Miramor Garden transaction.
 * 4. Fetch price lists from collection and recalculate all supply prices correctly.
 * 5. Update Firestore storage/appData document.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore';
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
  // Load clean transactions from backup
  const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
  const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
  console.log(`Loading clean transactions from backup: ${backupFile}`);
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

  function getPriceList(date) {
    if (priceLists[date]) return { date, prices: priceLists[date] };
    const prior = sortedDates.filter(d => d <= date);
    if (prior.length > 0) {
      const d = prior[prior.length - 1];
      return { date: d, prices: priceLists[d] };
    }
    return null;
  }

  // 1. Standardize Karpuz/Kavun transactions (Ton -> Kg) and split June 17
  console.log('Standardizing and splitting transactions...');
  const standardizedTxs = [];
  let convertedCount = 0;
  let splitCount = 0;

  txs.forEach(t => {
    const isMelon = t.product === 'KARPUZ' || t.product === 'KAVUN';
    
    if (isMelon && (t.buyPrice > 2000 || t.supplyPrice > 2000)) {
      // Ton transaction!
      const newQty = Math.round(t.qty * 1000 * 100) / 100;
      const newBuy = Math.round((t.buyPrice / 1000) * 100) / 100;
      const newSupply = Math.round((t.supplyPrice / 1000) * 100) / 100;
      
      convertedCount++;
      
      // Check for June 17 Karpuz Miramor Garden split case
      if (t.date === '2026-06-17' && t.product === 'KARPUZ' && t.hotel === 'MİRAMOR GARDEN' && Math.abs(newQty - 2030) < 5) {
        splitCount++;
        // Split into Miramor Garden (1050 kg) and Grand Miramor (980 kg)
        standardizedTxs.push({
          ...t,
          id: t.id,
          hotel: 'MİRAMOR GARDEN',
          qty: 1050,
          buyPrice: 10,
          supplyPrice: 22.5 // Base supply price, will be recalculated
        });
        standardizedTxs.push({
          ...t,
          id: t.id + 9999, // Unique ID
          hotel: 'GRAND MİRAMOR',
          qty: 980,
          buyPrice: 10,
          supplyPrice: 22.5 // Will be recalculated
        });
      } else {
        standardizedTxs.push({
          ...t,
          qty: newQty,
          buyPrice: newBuy,
          supplyPrice: newSupply
        });
      }
    } else {
      standardizedTxs.push(t);
    }
  });

  console.log(`  Converted ${convertedCount} transactions from ton to kg`);
  console.log(`  Split ${splitCount} grouped transactions`);

  // 2. Recalculate all supply prices based on borsa price lists
  console.log('Recalculating supply prices...');
  let recalculatedCount = 0;
  let unchangedCount = 0;
  let noMatchCount = 0;

  const finalTxs = standardizedTxs.map(tx => {
    if (!tx.product) return tx;

    const isSpecial = CASAFORA_SEAPHORIA.has((tx.hotel || '').toUpperCase().trim());
    const marginRate = isSpecial ? 0.22 : 0.18;

    const pl = getPriceList(tx.date);
    if (!pl) { noMatchCount++; return tx; }

    let pricesObj = pl.prices;
    if (Array.isArray(pricesObj)) {
      const flat = {};
      pricesObj.forEach(p => { flat[p.product.toUpperCase().trim()] = parseFloat(String(p.price).replace(/\./g, '').replace(',', '.')); });
      pricesObj = flat;
    }

    const result = getTutedPrice(pricesObj, tx.product);
    if (!result) { noMatchCount++; return tx; }

    // Since everything is standardized to kilograms, calculations are straightforward
    const origBuy = tx.buyPrice;
    const origSupply = tx.supplyPrice;

    if (origSupply === 0) {
      // Keep supplyPrice as 0 if it was originally 0
      return { ...tx, supplyPrice: 0 };
    }

    const newSupplyPrice = Math.round(result.price * marginRate * 100) / 100;
    const oldSupplyPrice = tx.supplyPrice;

    if (Math.abs(newSupplyPrice - oldSupplyPrice) > 0.01) {
      recalculatedCount++;
      return { ...tx, supplyPrice: newSupplyPrice, tuted: result.price, tutedFromDate: pl.date };
    } else {
      unchangedCount++;
      // Set metadata even if price is correct
      return { ...tx, tuted: result.price, tutedFromDate: pl.date };
    }
  });

  console.log(`  Recalculated: ${recalculatedCount}`);
  console.log(`  Unchanged:    ${unchangedCount}`);
  console.log(`  No match:     ${noMatchCount}`);

  // Test split on June 17
  console.log('\nVerifying June 17 split results in final dataset:');
  finalTxs.filter(t => t.date === '2026-06-17' && t.product === 'KARPUZ').forEach(t => {
    console.log(`  Hotel: ${t.hotel} | Product: ${t.product} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | Recalculated SupplyPrice: ${t.supplyPrice} | TÜTED: ${t.tuted}`);
  });

  // Write to Firestore
  console.log('\nWriting to Firestore (storage/appData)...');
  const appRef = doc(db, 'storage', 'appData');
  await updateDoc(appRef, { transactions: finalTxs });
  console.log('✅ Done! Standardization and final recalculations applied.');
}

main().catch(console.error);
