import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

async function testPdf() {
  const buf = fs.readFileSync('C:\\Users\\Baran\\Desktop\\tüted\\03.06.pdf');
  const parser = new PDFParse(new Uint8Array(buf));
  const data = await parser.getText();
  console.log('PDF Text Length:', data.text ? data.text.length : 'no text');
  console.log('Sample text:\n', (data.text || '').substring(0, 500));
}

testPdf();
