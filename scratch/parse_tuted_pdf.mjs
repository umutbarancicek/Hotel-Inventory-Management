import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

async function testPdf() {
  const dataBuffer = fs.readFileSync('C:\\Users\\Baran\\Desktop\\tüted\\30.04.pdf');
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();
  console.log('=== PDF TEXT (First 1500 chars) ===');
  console.log(data.text.slice(0, 1500));
}

testPdf();
