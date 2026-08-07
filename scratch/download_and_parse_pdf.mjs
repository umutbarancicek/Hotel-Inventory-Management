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
  const url = 'https://antalyatuted.org.tr/file/pdf/e659f44a-8043-41d4-a2f5-4f3f30238773.pdf';
  console.log('Downloading PDF from:', url);
  const pdfBuf = await downloadPdf(url);
  console.log('PDF Downloaded. Size:', pdfBuf.length);

  console.log('Parsing PDF...');
  const parser = new PDFParse(new Uint8Array(pdfBuf));
  const data = await parser.getText();
  console.log('PDF Parsed successfully!');
  console.log('Metadata / Text length:', data.text.length);
  console.log('First 500 chars of text:\n');
  console.log(data.text.slice(0, 1000));
}

run().catch(console.error);
