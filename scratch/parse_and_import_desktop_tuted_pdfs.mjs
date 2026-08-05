import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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

function parsePriceVal(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = String(str).replace(/\./g, '').replace(',', '.').trim();
  let val = parseFloat(clean) || 0;
  if (val > 500) val = val / 100;
  return val;
}

function getMarginRate(hotelName) {
  const hUpper = (hotelName || '').toUpperCase().trim();
  if (hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA')) {
    return 0.22;
  }
  return 0.18;
}

async function parsePdfFile(filePath, isoDate) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  
  const text = data.text || '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const priceListItems = [];

  for (let line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      const unitIdx = parts.findIndex(p => ['KG', 'ADET', 'PAKET', 'ÇUVAL', 'DEMET', 'PK'].includes(p.toUpperCase()));
      if (unitIdx > 0 && unitIdx + 1 < parts.length) {
        const prodName = parts.slice(0, unitIdx).join(' ');
        const unitName = parts[unitIdx];
        const priceStr = parts[unitIdx + 1];
        const priceNum = parsePriceVal(priceStr);
        if (priceNum > 0) {
          priceListItems.push({
            date: isoDate,
            product: prodName.toUpperCase(),
            unit: unitName,
            price: priceStr
          });
        }
      }
    }
  }

  return priceListItems;
}

async function main() {
  console.log('1. Reading PDF files from C:\\Users\\Baran\\Desktop\\tüted...');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const fbData = docSnap.data();

  const priceLists = fbData.priceLists || {};
  const transactions = fbData.transactions || [];

  const updatedPriceLists = { ...priceLists };

  for (const [fileName, isoDate] of Object.entries(fileToIsoDate)) {
    const fullPath = path.join(pdfFolder, fileName);
    if (fs.existsSync(fullPath)) {
      console.log(`Parsing ${fileName} for date ${isoDate}...`);
      const items = await parsePdfFile(fullPath, isoDate);
      console.log(`Extracted ${items.length} product prices for ${isoDate}.`);
      updatedPriceLists[isoDate] = items;
    } else {
      console.log(`File not found: ${fullPath}`);
    }
  }

  console.log('\n2. Recalculating transactions supply prices for newly imported dates...');
  let updatedTxCount = 0;

  transactions.forEach(tx => {
    if (fileToIsoDate[tx.date + '.pdf'] || (updatedPriceLists[tx.date] && updatedPriceLists[tx.date].length > 0)) {
      const priceList = updatedPriceLists[tx.date] || [];
      if (priceList.length === 0) return;

      const prodClean = cleanStr(tx.product);

      let pMatch = priceList.find(p => cleanStr(p.product) === prodClean);
      if (!pMatch) {
        pMatch = priceList.find(p => {
          const pName = cleanStr(p.product);
          return pName.includes(prodClean) || prodClean.includes(pName);
        });
      }

      if (pMatch) {
        const tutedVal = parsePriceVal(pMatch.price);
        if (tutedVal > 0) {
          const marginRate = getMarginRate(tx.hotel);
          tx.supplyPrice = Math.round(tutedVal * marginRate * 100) / 100;
          updatedTxCount++;
        }
      }
    }
  });

  console.log(`Updated supply prices for ${updatedTxCount} transactions.`);

  console.log('\n3. Saving updated priceLists and transactions to Firebase...');
  await updateDoc(docRef, {
    priceLists: updatedPriceLists,
    transactions: transactions
  });

  console.log('✅ PDF Price Lists imported and Firebase successfully updated!');
}

main().catch(console.error);
