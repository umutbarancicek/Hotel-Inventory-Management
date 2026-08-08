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

const pdfUrl = 'https://antalyatuted.org.tr/file/pdf/b49b6569-801b-49da-96f4-45fefc119cd4.pdf';
const buf = await fetchBinary(pdfUrl);
const data = await pdfParse(buf);
const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

lines.forEach(l => {
  if (l.includes('BLUE BERRY') || l.includes('ANANAS') || l.includes('ALTIN ÇİLEK')) {
    console.log(`Raw line: "${l}"`);
    console.log('Characters:');
    for (let i = 0; i < l.length; i++) {
      console.log(`  [${i}]: '${l[i]}' (code: ${l.charCodeAt(i)})`);
    }
  }
});
