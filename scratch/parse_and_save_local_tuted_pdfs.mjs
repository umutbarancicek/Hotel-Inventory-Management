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
const dateToPdf = {
  '2026-04-28': '28.04.pdf',
  '2026-05-18': '18.05.pdf',
  '2026-05-23': '23.05.pdf',
  '2026-05-24': '23.05.pdf', // Fallback for Sunday 24.05
  '2026-06-03': '03.06.pdf',
  '2026-07-03': '03.07.pdf',
  '2026-08-04': '04.08.pdf'
};

async function parseAndSaveLocalPdfs() {
  console.log('=== PARSING LOCAL TÜTED PDFS AND UPDATING DB ===');

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  const priceLists = data.priceLists || {};

  for (const [dateIso, pdfName] of Object.entries(dateToPdf)) {
    const filePath = path.join(pdfFolder, pdfName);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }

    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse(new Uint8Array(dataBuffer));
    const parsedData = await parser.getText();

    const items = [];
    const lines = parsedData.text.split('\n');

    lines.forEach(line => {
      const parts = line.split('\t').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const prodName = parts[0].toUpperCase();
        const unit = parts[1] || 'Kg';
        const priceStr = parts[parts.length - 1].trim();

        // Validate price string is a number
        const cleanPrice = priceStr.replace(/\./g, '').replace(',', '.');
        const numPrice = parseFloat(cleanPrice);
        if (!isNaN(numPrice) && numPrice > 0) {
          items.push({
            date: dateIso,
            product: prodName,
            unit: unit,
            price: priceStr // Keep original string format like '750,00'
          });
        }
      }
    });

    if (items.length > 0) {
      priceLists[dateIso] = items;
      console.log(`[OK] Saved ${items.length} items for ${dateIso} from ${pdfName}`);
    }
  }

  await updateDoc(docRef, {
    priceLists: priceLists
  });

  console.log('✅ Firebase priceLists successfully updated with local PDF data!');
}

parseAndSaveLocalPdfs().catch(console.error);
