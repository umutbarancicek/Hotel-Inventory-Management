import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const MARGIN = 1.82;

async function testPdfPrices() {
  const dataBuffer = fs.readFileSync('C:\\Users\\Baran\\Desktop\\tüted\\30.04.pdf');
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();
  
  console.log('=== TEST PDF PARSING FOR 30.04.pdf ===\n');
  const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    const parts = line.split('\t').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const prodName = parts[0].toUpperCase();
      const rawPriceStr = parts[parts.length - 1];
      // Format "210,00" -> 210.00 -> 21.00 TL
      const numClean = rawPriceStr.replace(/\./g, '').replace(',', '.');
      const rawVal = parseFloat(numClean);
      if (!isNaN(rawVal) && rawVal > 0) {
        const tutedPriceTL = rawVal / 10; // PDF values are x10
        const supplyPrice = Math.round(tutedPriceTL * MARGIN * 100) / 100;
        if (['DOMATES', 'KABAK SAKIZ', 'LAHANA BEYAZ', 'ELMA GOLDEN', 'PATATES TAZE', 'BİBER ÇARLİSTON'].includes(prodName)) {
          console.log(`${prodName.padEnd(25)} | Raw PDF: ${rawPriceStr.padEnd(8)} -> TÜTED TL: ${tutedPriceTL.toFixed(2).padEnd(6)} TL -> Supply (%182): ${supplyPrice} TL`);
        }
      }
    }
  }
}

testPdfPrices();
