import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

async function fullPdfText(filename) {
  const filePath = 'C:\\Users\\Baran\\Desktop\\tüted\\' + filename;
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();
  console.log(`\n================ FULL TEXT: ${filename} ================`);
  console.log(data.text);
}

fullPdfText('30.04.pdf');
