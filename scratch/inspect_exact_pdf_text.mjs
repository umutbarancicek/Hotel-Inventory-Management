import https from 'https';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

function downloadPdf(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  // Let's find the URL for 2026-04-24 from the website first
  const pageHtmlBuf = await downloadPdf('https://antalyatuted.org.tr/Fiyat/Index?Sayfa=3');
  const htmlStr = pageHtmlBuf.toString('utf-8');

  const regex = /<td>\s*<a href="(\/file\/pdf\/[^"]+)" target="_blank">\s*24\.04\.2026[^<]*<\/a>/g;
  const match = regex.exec(htmlStr);
  if (!match) {
    console.log('PDF link for 24.04.2026 not found!');
    return;
  }
  const url = 'https://antalyatuted.org.tr' + match[1];
  console.log('Downloading PDF from:', url);
  const pdfBuf = await downloadPdf(url);

  console.log('Parsing PDF...');
  const parser = new PDFParse(new Uint8Array(pdfBuf));
  const data = await parser.getText();
  
  console.log('PDF Text for 24.04.2026:');
  const lines = data.text.split('\n');
  lines.forEach(line => {
    if (line.includes('BİBER') || line.includes('DOMATES') || line.includes('PATLICAN')) {
      console.log(line);
    }
  });
}

run().catch(console.error);
