import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import https from 'https';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBinary(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Fetch main page and find first PDF url
const html = await fetchText('https://antalyatuted.org.tr/Fiyat/Index');
const pdfs = [...html.matchAll(/\/file\/pdf\/([a-f0-9\-]+\.pdf)/g)].map(m => `https://antalyatuted.org.tr/file/pdf/${m[1]}`);

if (pdfs.length === 0) {
  console.log('No PDF found on first page!');
  process.exit(1);
}

const pdfUrl = pdfs[0];
console.log(`Downloading PDF: ${pdfUrl}`);

const buf = await fetchBinary(pdfUrl);
const data = await pdfParse(buf);
const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

console.log('Total raw lines parsed from PDF:', lines.length);

const lineRe = /^(.+?)(Pk\s*\/\s*\d+\s*Gr|Pk\s*\/\s*\d+\s*Ml|\d+\s*Gr|\d+\s*Ml|Kg|Adet|Bağ|Pk|Demet|Lt|Ml|Gr)\s*([\d\.]+,\d{2})$/i;

console.log('\nRegex matching test on parsed lines:');
let matchedCount = 0;
lines.forEach(l => {
  const m = l.match(lineRe);
  if (m) {
    matchedCount++;
    const name = m[1].trim();
    const unit = m[2].trim();
    const price = m[3].trim();
    if (name.includes('BERRY') || name.includes('AHUDUDU') || name.includes('MİNİ') || name.includes('ÇİLEK') || name.includes('BÖĞÜRTLEN')) {
      console.log(`  Match: [${name}] | Unit: [${unit}] | Price: [${price}]`);
    }
  }
});

console.log(`\nMatched ${matchedCount} lines out of ${lines.length}`);
