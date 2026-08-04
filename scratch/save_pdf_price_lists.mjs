import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

const dateToPdfFile = {
  '2026-04-30': '30.04.pdf',
  '2026-05-01': '01.05.pdf',
  '2026-05-06': '06.05.pdf',
  '2026-05-09': '09.05.pdf',
  '2026-05-12': '12.05.pdf',
  '2026-05-30': '30.05.pdf',
  '2026-05-31': '30.05.pdf',
  '2026-06-01': '01.06.pdf',
  '2026-06-11': '11.06.pdf',
  '2026-06-12': '12.06.pdf',
  '2026-06-13': '13.06.pdf',
  '2026-06-14': '13.06.pdf',
  '2026-06-27': '27.06.pdf',
};

async function parsePdfToPriceArray(filename, isoDate) {
  const filePath = path.join(pdfFolder, filename);
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();
  
  const priceItems = [];
  const lines = data.text.split('\n');
  
  for (const line of lines) {
    const parts = line.split('\t').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const prodName = parts[0].toUpperCase();
      const unit = parts[1] || 'KG';
      const priceStr = parts[parts.length - 1].replace(/\./g, '').replace(',', '.');
      const rawVal = parseFloat(priceStr);
      if (!isNaN(rawVal) && rawVal > 0) {
        // PDF prices are x10 -> convert to TL
        const priceTL = (rawVal / 10).toFixed(2);
        priceItems.push({
          date: isoDate,
          product: prodName,
          unit: unit,
          price: priceTL
        });
      }
    }
  }
  return priceItems;
}

async function main() {
  console.log('Loading Firebase data...');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) process.exit(1);
  const fbData = docSnap.data();

  if (!fbData.priceLists) fbData.priceLists = {};

  console.log('Parsing PDF price lists and adding to Firebase priceLists...');
  for (const [isoDate, pdfName] of Object.entries(dateToPdfFile)) {
    const items = await parsePdfToPriceArray(pdfName, isoDate);
    fbData.priceLists[isoDate] = items;
    console.log(`Saved priceList for ${isoDate} (${pdfName}): ${items.length} items`);
  }

  console.log('\nSaving updated priceLists to Firebase...');
  await setDoc(docRef, fbData);
  console.log('✅ Successfully saved all PDF TÜTED price lists to Firebase!');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
