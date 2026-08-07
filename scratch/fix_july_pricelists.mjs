/**
 * Temmuz 7, 9, 21, 22, 25 tarihlerindeki Firestore priceLists belgelerini
 * Desktop/tüted klasöründeki PDF'lerden yeniden oluştur.
 * 
 * 07.07 → 03.07.pdf (en yakın PDF)
 * 09.07 → 10.07.pdf (en yakın PDF, 1 gün sonrası)
 * 21.07 → 23.07.pdf (en yakın sonraki) veya 10.07.pdf
 * 22.07 → 23.07.pdf
 * 25.07 → 23.07.pdf
 * 27.07 → 27.07.pdf (zaten Firestore'da mevcut ve dolu)
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

const TUTED_FOLDER = "C:\\Users\\Baran\\Desktop\\tüted";

// DATE → PDF file to use (her tarihin kendi PDF'i)
const DATE_TO_PDF = {
  '2026-07-07': '07.07.pdf',
  '2026-07-09': '09.07.pdf',
  '2026-07-21': '21.07.pdf',
  '2026-07-22': '23.07.pdf',
  '2026-07-25': '23.07.pdf',
  '2026-07-27': '23.07.pdf',
};

function parseTRPrice(str) {
  if (!str) return null;
  const s = str.trim().replace(/\s/g, '');
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d+,\d+$/.test(s)) return parseFloat(s.replace(',', '.'));
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  return null;
}

async function parsePdf(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const parsedData = await parser.getText();
  const lines = parsedData.text.split('\n');
  const prices = {};

  for (const line of lines) {
    const parts = line.split('\t').map(s => s.trim()).filter(s => s.length > 0);
    if (parts.length >= 3) {
      const prodName = parts[0].toUpperCase().trim();
      if (!prodName || /^\d/.test(prodName)) continue;
      if (['MAL ADI', 'ÜRÜN ADI', 'FİYAT', 'BİRİM', 'TOPLAM', 'ANTALYA', 'HAL', 'TARİH'].some(h => prodName.includes(h))) continue;
      if (prodName.length < 2 || prodName.length > 50) continue;

      const priceStr = parts[parts.length - 1];
      const price = parseTRPrice(priceStr);
      if (price && price > 0 && price < 50000) {
        prices[prodName] = price;
      }
    }
  }
  return prices;
}

async function main() {
  console.log('=== Overwriting July price lists with correct PDF data ===\n');

  // Cache parsed PDFs
  const pdfCache = {};

  for (const [dateISO, pdfFile] of Object.entries(DATE_TO_PDF)) {
    const pdfPath = path.join(TUTED_FOLDER, pdfFile);
    if (!fs.existsSync(pdfPath)) {
      console.log(`⚠️ PDF not found: ${pdfPath}`);
      continue;
    }

    if (!pdfCache[pdfFile]) {
      console.log(`Parsing ${pdfFile}...`);
      pdfCache[pdfFile] = await parsePdf(pdfPath);
      console.log(`  → ${Object.keys(pdfCache[pdfFile]).length} products`);
    }

    const prices = pdfCache[pdfFile];
    
    // Save to Firestore, OVERWRITING the existing (bad) data
    await setDoc(doc(db, 'priceLists', dateISO), {
      prices,
      source: `local_pdf:${pdfFile}`,
      parsedAt: new Date().toISOString()
    });
    console.log(`  ✅ Saved priceLists/${dateISO} (from ${pdfFile}) — ${Object.keys(prices).length} products`);
  }

  console.log('\nDone! Now re-run the full_reimport_with_tuted.mjs to recalculate supply prices.');
}

main().catch(console.error);
