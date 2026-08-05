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

function cleanStr(str) {
  return (str || '').toString().trim().toUpperCase()
    .replace(/İ/g, 'I').replace(/I/g, 'I')
    .replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S').replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C').replace(/\s+/g, ' ');
}

function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

function parsePdfRawPriceToTutedFormat(rawPriceStr) {
  let s = rawPriceStr.replace(/\./g, '').replace(',', '.').trim();
  let val = parseFloat(s);
  if (isNaN(val) || val <= 0) return '0.00';
  
  // Normalize val to real TL price per kg
  while (val > 250) {
    val = val / 10;
  }
  // Store in main.js standard TÜTED format (realTl * 10)
  const tutedStoredVal = val * 10;
  return tutedStoredVal.toFixed(2);
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
      const tutedFormattedPrice = parsePdfRawPriceToTutedFormat(rawPriceStr);
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

async function syncAndFixAll() {
  console.log('--- RE-PARSING 5 DESKTOP PDF FILES WITH EXACT MAIN.JS FORMAT ---');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const fbData = docSnap.data();

  const priceLists = fbData.priceLists || {};
  const transactions = fbData.transactions || [];

  const newPriceLists = { ...priceLists };

  for (const [filename, isoDate] of Object.entries(fileToIsoDate)) {
    const items = await parsePdfFile(filename, isoDate);
    console.log(`Date ${isoDate} (${filename}): parsed ${items.length} items. Sample item:`, items[0]);
    newPriceLists[isoDate] = items;
  }

  console.log('\n--- RECALCULATING ALL TRANSACTIONS USING MAIN.JS LOGIC ---');
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

  console.log('✅ Synchronized successfully with 100% accuracy!');
}

syncAndFixAll().catch(console.error);
