/**
 * Quick debug: just download one old PDF and print its full raw text
 */
import https from 'https';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchBinary(res.headers.location).then(resolve).catch(reject);
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

// 26.05.2026 PDF
const buf = await fetchBinary('https://antalyatuted.org.tr/file/pdf/21048401-d1c1-45a9-81cc-89eb42dbd25d.pdf');
console.log('Size:', buf.length, 'sig:', buf.slice(0,4).toString('hex'));

const data = await pdfParse(buf);
console.log('Pages:', data.numpages);
console.log('=== FULL TEXT ===');
console.log(data.text);
