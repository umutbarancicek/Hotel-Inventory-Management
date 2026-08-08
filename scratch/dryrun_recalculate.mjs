/**
 * DRY RUN - Recalculate supply prices WITHOUT writing to Firestore
 * 
 * Shows:
 * - Sample of changed prices (before vs after)
 * - Summary statistics
 * - Exports full diff to a CSV file for Excel review
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
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

const CASAFORA_SEAPHORIA = ['CASAFORA', 'SEAPHORİA', 'SEAPHORIA'];

const PRODUCT_ALIASES = {
  'DOMATES': ['DOMATES', 'DOMATES STANDART', 'DOMATES I.KAL', 'SELE DOMATES'],
  'DOMATES KOKTEYL': ['DOMATES KOKTEYL', 'KOKTEYL DOMATES'],
  'BİBER DOLMA': ['BİBER DOLMA', 'DOLMA BİBER', 'DOLMALIK BİBER', 'BİBER DOLMALIK'],
  'BİBER ÇARLİSTON': ['BİBER ÇARLİSTON', 'ÇARLİSTON BİBER'],
  'BİBER SİVRİ': ['BİBER SİVRİ', 'SİVRİ BİBER', 'BİBER KIL'],
  'BİBER KAPYA': ['BİBER KAPYA', 'KAPYA BİBER'],
  'PATLICAN': ['PATLICAN', 'KEMER PATLİCAN'],
  'SALATALIK SİLOR PAKET': ['SALATALIK SİLOR PAKET', 'SALATALIK', 'SİLOR SALATALIK', 'HIYAR YAYLA'],
  'KABAK SAKIZ': ['KABAK SAKIZ', 'KABAK', 'SAKIZ KABAK'],
  'PORTAKAL SIKMALIK': ['PORTAKAL SIKMALIK', 'PORTAKAL', 'SIKMALIK PORTAKAL'],
  'ELMA GOLDEN': ['ELMA GOLDEN', 'GOLDEN ELMA'],
  'ELMA STARKING': ['ELMA STARKING', 'STARKING ELMA'],
  'ELMA GRANNY SMİTH': ['ELMA GRANNY SMİTH', 'GRANNY SMITH', 'ELMA GRANSİMİT'],
  'NEKTARİN': ['NEKTARİN', 'NEKTARIN'],
  'ŞEFTALİ': ['ŞEFTALİ', 'SEFTALİ'],
  'ERİK ANJELİKA': ['ERİK ANJELİKA', 'ERİK'],
  'ERİK PAPAZ': ['ERİK PAPAZ', 'PAPAZ ERİĞİ'],
  'MARUL DÜZ': ['MARUL DÜZ', 'MARUL'],
  'MARUL LOLO ROSSO KIRMIZI': ['MARUL LOLO ROSSO KIRMIZI', 'LOLOROSSO', 'MARUL POLOROSSO', 'LOLO ROSSO'],
  'MARUL AYSBERG': ['MARUL AYSBERG', 'AYSBERG MARUL', 'MARUL ICEBERG'],
  'MARUL KIVIRCIK': ['MARUL KIVIRCIK', 'KIVIRCIK MARUL'],
  'HAVUÇ': ['HAVUÇ', 'HAVUÇ BEYPAZARI'],
  'HAVUÇ BEYPAZARI': ['HAVUÇ BEYPAZARI', 'HAVUÇ'],
  'PATATES': ['PATATES', 'PATATES TAZE', 'PATATES BABY'],
  'PATATES TAZE': ['PATATES TAZE', 'PATATES'],
  'SOĞAN KURU': ['SOĞAN KURU', 'KURU SOĞAN'],
  'SOĞAN KIRMIZI': ['SOĞAN KIRMIZI', 'KIRMIZI SOĞAN'],
  'LAHANA': ['LAHANA', 'LAHANA BEYAZ', 'LAHANA KARADENİZ'],
  'LAHANA KIRMIZI': ['LAHANA KIRMIZI', 'KIRMIZI LAHANA'],
  'DEREOTU': ['DEREOTU', 'DERE OTU'],
  'MAYDANOZ': ['MAYDANOZ', 'MAYDONOZ'],
  'NANE TAZE': ['NANE TAZE', 'NANE'],
  'NANE': ['NANE', 'NANE TAZE'],
  'ROKA': ['ROKA'],
  'SEMİZOTU': ['SEMİZOTU', 'SEMİZ OTU'],
  'PANCAR KIRMIZI': ['PANCAR KIRMIZI', 'KIRMIZI PANCAR', 'PANCAR'],
  'LİMON': ['LİMON'],
  'MUZ YERLİ': ['MUZ YERLİ', 'MUZ'],
  'GREYFURT': ['GREYFURT'],
  'KİRAZ': ['KİRAZ'],
  'KAYISI': ['KAYISI'],
  'ÇİLEK': ['ÇİLEK'],
  'FESLEĞEN': ['FESLEĞEN'],
  'MANTAR TAZE': ['MANTAR TAZE', 'MANTAR'],
};

function getTutedPrice(prices, productName) {
  const key = productName.toUpperCase().trim();
  if (prices[key] !== undefined) return prices[key];
  const variants = PRODUCT_ALIASES[key] || [key];
  for (const v of variants) {
    if (prices[v] !== undefined) return prices[v];
    const match = Object.keys(prices).find(k => k === v || k.includes(v) || v.includes(k));
    if (match) return prices[match];
  }
  return null;
}

async function main() {
  console.log('Loading transactions from Firestore...');
  const appSnap = await getDoc(doc(db, 'storage', 'appData'));
  const txs = appSnap.data().transactions || [];
  console.log(`Loaded ${txs.length} transactions\n`);

  console.log('Loading all price lists...');
  const priceListsSnap = await getDocs(collection(db, 'priceLists'));
  const priceLists = {};
  priceListsSnap.forEach(d => { priceLists[d.id] = d.data().prices || {}; });
  const sortedPriceDates = Object.keys(priceLists).sort();
  console.log(`Loaded ${sortedPriceDates.length} price lists\n`);

  function getPriceListForDate(date) {
    if (priceLists[date]) return { date, prices: priceLists[date] };
    const prior = sortedPriceDates.filter(d => d <= date);
    if (prior.length > 0) {
      const d = prior[prior.length - 1];
      return { date: d, prices: priceLists[d] };
    }
    return null;
  }

  // Dry run
  const changes = [];
  let noTuted = 0, unchanged = 0, changed = 0;

  for (const tx of txs) {
    const isSpecial = CASAFORA_SEAPHORIA.includes((tx.hotel || '').toUpperCase());
    const marginRate = isSpecial ? 0.22 : 0.18;

    const pl = getPriceListForDate(tx.date);
    if (!pl) { noTuted++; continue; }

    const tutedPrice = getTutedPrice(pl.prices, tx.product);
    if (tutedPrice === null) { noTuted++; continue; }

    const newSupplyPrice = Math.round(tutedPrice * marginRate * 100) / 100;
    const oldSupplyPrice = tx.supplyPrice;
    const diff = Math.round((newSupplyPrice - oldSupplyPrice) * 100) / 100;

    if (Math.abs(diff) > 0.01) {
      changed++;
      changes.push({
        date: tx.date,
        supplier: tx.supplier,
        hotel: tx.hotel,
        product: tx.product,
        qty: tx.qty,
        oldSupplyPrice,
        newSupplyPrice,
        diff,
        tutedPrice,
        priceListDate: pl.date,
        marginRate
      });
    } else {
      unchanged++;
    }
  }

  // Print summary
  console.log('=== DRY RUN SUMMARY ===');
  console.log(`Total transactions: ${txs.length}`);
  console.log(`Will be CHANGED:    ${changed}`);
  console.log(`Already correct:    ${unchanged}`);
  console.log(`No TÜTED match:     ${noTuted}`);
  
  // Print sample of changes
  console.log('\n=== SAMPLE CHANGES (first 20) ===');
  console.log('Date       | Hotel      | Product                    | Old ₺  | New ₺  | Diff');
  console.log('-'.repeat(90));
  changes.slice(0, 20).forEach(c => {
    const product = c.product.padEnd(28).slice(0, 28);
    const hotel = c.hotel.padEnd(10).slice(0, 10);
    const sign = c.diff > 0 ? '+' : '';
    console.log(`${c.date} | ${hotel} | ${product} | ${String(c.oldSupplyPrice).padStart(6)} | ${String(c.newSupplyPrice).padStart(6)} | ${sign}${c.diff}`);
  });

  // Largest changes
  console.log('\n=== TOP 10 BIGGEST CHANGES ===');
  [...changes].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 10).forEach(c => {
    const sign = c.diff > 0 ? '+' : '';
    console.log(`  ${c.date} ${c.hotel} ${c.product}: ${c.oldSupplyPrice} -> ${c.newSupplyPrice} (${sign}${c.diff})`);
  });

  // Export to CSV
  const csvLines = ['date,supplier,hotel,product,qty,oldSupplyPrice,newSupplyPrice,diff,tutedPrice,priceListDate,marginRate'];
  changes.forEach(c => {
    csvLines.push([c.date, c.supplier, c.hotel, c.product, c.qty, c.oldSupplyPrice, c.newSupplyPrice, c.diff, c.tutedPrice, c.priceListDate, c.marginRate].join(','));
  });
  const csvPath = 'scratch/supply_price_diff.csv';
  fs.writeFileSync(csvPath, '\uFEFF' + csvLines.join('\n'), 'utf-8'); // BOM for Turkish Excel
  console.log(`\n✅ Full diff exported to: ${csvPath}`);
  console.log('   Open in Excel to review all changes before applying!');
}

main().catch(console.error);
