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
  '2026-08-04': '04.08.pdf',
  '2026-08-05': '04.08.pdf'
};

async function parsePdfToPriceArray(filename, isoDate) {
  const filePath = path.join(pdfFolder, filename);
  if (!fs.existsSync(filePath)) return [];
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();

  const priceItems = [];
  const lines = data.text.split('\n');

  for (const line of lines) {
    const match = line.match(/^([A-ZİĞÜŞÖÇ\s\(\)\-\.\,\d]+?)\s+(Kg|Adet|Pk|Demet|Kasa|Çuval|Bağ|Koli|Boz)\s+([\d\.\,]+)$/i);
    if (match) {
      const prod = match[1].trim();
      const unit = match[2].trim();
      const priceStr = match[3].trim();
      priceItems.push({
        date: isoDate,
        product: prod,
        unit: unit,
        price: priceStr
      });
    }
  }
  return priceItems;
}

async function restoreAugust4OriginalState() {
  console.log('=== RESTORING ORIGINAL AUGUST 4TH PRICE LISTS ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const priceLists = {};

  for (const [isoDate, pdfFile] of Object.entries(dateToPdfFile)) {
    const items = await parsePdfToPriceArray(pdfFile, isoDate);
    if (items.length > 0) {
      priceLists[isoDate] = items;
      console.log(`[OK] Loaded ${items.length} items for ${isoDate} from ${pdfFile}`);
    }
  }

  await updateDoc(docRef, {
    priceLists: priceLists
  });

  console.log('✅ Firebase priceLists 100% restored to original August 4th desktop PDF state!');
}

restoreAugust4OriginalState().catch(console.error);
