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

function parsePdfPrice(priceStr) {
  let s = priceStr.replace(/\./g, '').replace(',', '.').trim();
  let val = parseFloat(s);
  if (isNaN(val) || val <= 0) return 0;
  // If price is e.g. 150.00 (which is 15.00 TL) or 1500.00 (which is 15.00 TL in 100kg notation)
  if (val >= 100) {
    val = val / 10;
  }
  return Math.round(val * 100) / 100;
}

function getMarginRate(hotelName) {
  const hUpper = (hotelName || '').toUpperCase().trim();
  if (hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA')) {
    return 0.22;
  }
  return 0.18;
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
      const parsedVal = parsePdfPrice(rawPriceStr);
      if (parsedVal > 0) {
        priceListItems.push({
          date: isoDate,
          product: prodName,
          unit: unit,
          price: parsedVal.toFixed(2)
        });
      }
    }
  }

  return priceListItems;
}

async function runImport() {
  console.log('--- PARSING 5 DESKTOP PDF FILES ---');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const fbData = docSnap.data();

  const priceLists = fbData.priceLists || {};
  const transactions = fbData.transactions || [];

  const newPriceLists = { ...priceLists };

  for (const [filename, isoDate] of Object.entries(fileToIsoDate)) {
    const items = await parsePdfFile(filename, isoDate);
    console.log(`Date ${isoDate} (${filename}): parsed ${items.length} product prices.`);
    newPriceLists[isoDate] = items;
    console.log(`Sample item 0:`, items[0]);
    console.log(`Sample item 1:`, items[1]);
  }

  console.log('\n--- RECALCULATING SUPPLY PRICES FOR TRANSACTIONS ---');
  let updatedTxCount = 0;

  transactions.forEach(tx => {
    if (fileToIsoDate[tx.date + '.pdf'] || (newPriceLists[tx.date] && newPriceLists[tx.date].length > 0)) {
      const list = newPriceLists[tx.date] || [];
      if (list.length === 0) return;

      const prodClean = cleanStr(tx.product);

      let pMatch = list.find(p => cleanStr(p.product) === prodClean);
      if (!pMatch) {
        pMatch = list.find(p => {
          const pName = cleanStr(p.product);
          return pName.includes(prodClean) || prodClean.includes(pName);
        });
      }

      if (pMatch) {
        const tutedVal = parseFloat(pMatch.price) || 0;
        if (tutedVal > 0) {
          const marginRate = getMarginRate(tx.hotel);
          tx.supplyPrice = Math.round(tutedVal * marginRate * 100) / 100;
          updatedTxCount++;
        }
      }
    }
  });

  console.log(`Updated ${updatedTxCount} transactions supply prices.`);

  await updateDoc(docRef, {
    priceLists: newPriceLists,
    transactions: transactions
  });

  console.log('\n✅ Firebase successfully updated with prices from the 5 desktop PDF files!');
}

runImport();
