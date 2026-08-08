/**
 * Debug: PDF parse test with correct PDFParse class
 */
import https from 'https';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

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

const pdfUrl = 'https://antalyatuted.org.tr/file/pdf/21048401-d1c1-45a9-81cc-89eb42dbd25d.pdf'; // 26.05.2026
console.log('Downloading 26.05.2026 PDF...');
const buffer = await fetchBinary(pdfUrl);
console.log(`Size: ${buffer.length} bytes`);

const parser = new PDFParse();
const data = await parser.parse(buffer);
console.log(`Pages: ${data.numpages}`);
console.log(`\n--- FULL TEXT (first 3000 chars) ---\n${data.text.slice(0, 3000)}`);
