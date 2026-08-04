import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const pdfFolder = 'C:\\Users\\Baran\\Desktop\\tüted';

async function inspectPdf(filename) {
  const filePath = path.join(pdfFolder, filename);
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();
  
  console.log(`\n================ ${filename} ================`);
  const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);
  lines.slice(0, 30).forEach((line, i) => {
    console.log(`L${i+1}: ${JSON.stringify(line)}`);
  });
}

async function main() {
  await inspectPdf('30.04.pdf');
  await inspectPdf('30.05.pdf');
}

main();
