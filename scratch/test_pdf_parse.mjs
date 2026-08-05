import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

async function testPdf() {
  const buf = fs.readFileSync('C:\\Users\\Baran\\Desktop\\tüted\\03.06.pdf');
  const data = await pdfParse(buf);
  console.log('PDF Text Length:', data.text.length);
  console.log('First 500 chars:\n', data.text.substring(0, 500));
}

testPdf();
