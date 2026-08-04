import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import * as XLSX from 'xlsx';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const pdfFolder = 'C:\\Users\\Baran\\Desktop\\tüted';

// Read Ertaşlar Excel
const ertaslarPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = fs.readFileSync(ertaslarPath);
const wb = XLSX.read(buf, { type: 'buffer', raw: false, dateNF: 'DD.MM.YYYY' });
const ws = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'DD.MM.YYYY' });
const ertaslarData = rows.slice(1).filter(r => r[0] && r[1] && r[4]);

console.log('Ertaşlar total data rows:', ertaslarData.length);

// Print unique dates in Ertaşlar
const datesInErtaşlar = [...new Set(ertaslarData.map(r => r[0]))].sort();
console.log('Dates in Ertaşlar:', datesInErtaşlar);

// Inspect each PDF file text completely
async function inspectPdfs() {
  const files = fs.readdirSync(pdfFolder).filter(f => f.endsWith('.pdf'));
  console.log('\nPDF files in folder:', files);

  for (const file of files) {
    const filePath = path.join(pdfFolder, file);
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse(new Uint8Array(dataBuffer));
    const data = await parser.getText();
    
    console.log(`\n================ FILE: ${file} ================`);
    const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);
    console.log(`Total lines: ${lines.length}`);
    console.log('First 20 lines:');
    lines.slice(0, 20).forEach((l, i) => console.log(`  ${i+1}: ${l}`));
  }
}

inspectPdfs();
