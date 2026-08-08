import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import https from 'https';

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

const pdfUrl = 'https://antalyatuted.org.tr/file/pdf/5ab8219c-9c98-4c81-8b43-98cc425e4c0d.pdf'; // 24.04.2026 PDF
const buf = await fetchBinary(pdfUrl);
const data = await pdfParse(buf);
const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

console.log('Total raw lines parsed from PDF:', lines.length);
console.log('\nSample lines containing BLUE BERRY or AHUDUDU or KABAK MİNİ:');
lines.forEach(l => {
  const upper = l.toUpperCase();
  if (upper.includes('BERRY') || upper.includes('AHUDUDU') || upper.includes('MİNİ') || upper.includes('ÇİLEK')) {
    console.log(`  "${l}"`);
  }
});

// Let's test our new regex on these lines
const lineRe = /^(.+?)(Pk\s*\/\s*\d+\s*Gr|Pk\s*\/\s*\d+\s*Ml|\d+\s*Gr|\d+\s*Ml|Kg|Adet|Bağ|Pk|Demet|Lt|Ml|Gr)\s*([\d\.]+,\d{2})$/i;

console.log('\nRegex matching test:');
lines.forEach(l => {
  const upper = l.toUpperCase();
  if (upper.includes('BERRY') || upper.includes('AHUDUDU') || upper.includes('MİNİ') || upper.includes('ÇİLEK')) {
    const m = l.match(lineRe);
    if (m) {
      console.log(`  Match SUCCESS:`);
      console.log(`    Original: "${l}"`);
      console.log(`    Product:  "${m[1]}"`);
      console.log(`    Unit:     "${m[2]}"`);
      console.log(`    Price:    "${m[3]}"`);
    } else {
      console.log(`  Match FAILED: "${l}"`);
    }
  }
});
