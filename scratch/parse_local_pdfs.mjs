import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const pdfFolder = 'C:\\Users\\Baran\\Desktop\\tüted';
const pdfFiles = ['28.04.pdf', '18.05.pdf', '23.05.pdf', '03.06.pdf', '03.07.pdf', '04.08.pdf'];

async function testPdfParse() {
  for (const file of pdfFiles) {
    const filePath = path.join(pdfFolder, file);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const parser = new PDFParse(new Uint8Array(dataBuffer));
      const data = await parser.getText();
      console.log(`\n========================================`);
      console.log(`Parsed ${file} (${data.text.length} chars)`);
      
      const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);
      console.log(`Total lines: ${lines.length}`);
      
      // Let's print out lines containing some product keywords
      console.log('Sample matches:');
      lines.forEach(l => {
        const upper = l.toUpperCase();
        if (upper.includes('PATATES') || upper.includes('BİBER') || upper.includes('DOMATES') || upper.includes('ÇİLEK') || upper.includes('ERİK') || upper.includes('MUZ') || upper.includes('SOĞAN') || upper.includes('MARUL') || upper.includes('KABAK')) {
          console.log(`  ${l}`);
        }
      });
    } catch (err) {
      console.error(`Error parsing ${file}:`, err);
    }
  }
}

testPdfParse().catch(console.error);
