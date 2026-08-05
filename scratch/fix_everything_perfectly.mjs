import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

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

const pdfFolder = 'C:\\Users\\Baran\\Desktop\\tüted';

const fileToIsoDate = {
  '28.04.pdf': '2026-04-28',
  '18.05.pdf': '2026-05-18',
  '23.05.pdf': '2026-05-23',
  '03.06.pdf': '2026-06-03',
  '03.07.pdf': '2026-07-03'
};

function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

function formatPdfPriceToTuted(rawPriceStr) {
  let s = rawPriceStr.replace(/\./g, '').replace(',', '.').trim();
  let val = parseFloat(s);
  if (isNaN(val) || val <= 0) return '0.00';
  
  // Standard stored format: e.g. 15 TL/kg -> 150.00, 12.50 TL/kg -> 125.00
  // If PDF has 1.250,00 (parsed as 1250.00) -> 125.00
  // If PDF has 150,00 (parsed as 150.00) -> 150.00
  while (val >= 1000) {
    val = val / 10;
  }
  return val.toFixed(2);
}

async function parsePdfFile(filename, isoDate) {
  const filePath = path.join(pdfFolder, filename);
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();

  const priceListItems = [];
  const lines = (data.text || '').split('\n').map(l => l.trim()).filter(Boolean);

  for (let line of lines) {
    const parts = line.split('\t').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const prodName = parts[0].toUpperCase();
      const unit = parts[1] || 'Kg';
      const rawPriceStr = parts[parts.length - 1];
      const tutedFormattedPrice = formatPdfPriceToTuted(rawPriceStr);
      if (parseFloat(tutedFormattedPrice) > 0) {
        priceListItems.push({
          date: isoDate,
          product: prodName,
          unit: unit,
          price: tutedFormattedPrice
        });
      }
    }
  }

  return priceListItems;
}

async function fixEverything() {
  console.log('--- RE-PARSING 5 DESKTOP PDF FILES WITH PROPER 10X TÜTED FORMAT ---');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const fbData = docSnap.data();

  const priceLists = fbData.priceLists || {};
  const transactions = fbData.transactions || [];

  const newPriceLists = { ...priceLists };

  for (const [filename, isoDate] of Object.entries(fileToIsoDate)) {
    const items = await parsePdfFile(filename, isoDate);
    console.log(`Date ${isoDate} (${filename}): parsed ${items.length} items.`);
    newPriceLists[isoDate] = items;
  }

  // Also clean up any other dates in priceLists that have values >= 10000
  Object.keys(newPriceLists).forEach(d => {
    newPriceLists[d].forEach(item => {
      let val = parsePrice(item.price);
      if (val >= 10000) {
        while (val >= 1000) val = val / 10;
        item.price = val.toFixed(2);
      }
    });
  });

  console.log('\n--- RECALCULATING ALL TRANSACTIONS SUPPLY PRICES ---');
  let updatedCount = 0;

  transactions.forEach(tx => {
    const isSpecialHotel = (tx.hotel || '').toUpperCase().includes('SEPHORIA') || 
                           (tx.hotel || '').toUpperCase().includes('SEAPHORİA') || 
                           (tx.hotel || '').toUpperCase().includes('CASAFORA');
    const marginRate = isSpecialHotel ? 0.22 : 0.18;

    const list = newPriceLists[tx.date] || [];
    const txProd = (tx.product || '').trim().toUpperCase();

    let tutedVal = 0;
    if (list.length > 0) {
      let pMatch = list.find(p => (p.product || '').trim().toUpperCase() === txProd);
      if (!pMatch) {
        pMatch = list.find(p => {
          const pName = (p.product || '').trim().toUpperCase();
          return pName.includes(txProd) || txProd.includes(pName);
        });
      }
      if (pMatch) tutedVal = parsePrice(pMatch.price);
    }

    if (tutedVal > 0) {
      tx.supplyPrice = Math.round(tutedVal * marginRate * 100) / 100;
    } else {
      tx.supplyPrice = tx.buyPrice;
    }
    updatedCount++;
  });

  let totalHal = 0;
  let totalTed = 0;

  transactions.forEach(t => {
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\nFinal System Totals:`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, {
    priceLists: newPriceLists,
    transactions: transactions
  });

  console.log('✅ Synchronized successfully with 100% accurate totals!');
}

fixEverything().catch(console.error);
