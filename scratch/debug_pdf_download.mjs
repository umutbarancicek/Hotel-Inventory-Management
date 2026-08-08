/**
 * Debug: Download ONE PDF and inspect its raw content
 */
import https from 'https';

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

// 2026-04-28 PDF URL (scraped from page 3 of site)
// Let's first fetch the listing page and grab an actual PDF URL
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchText(res.headers.location).then(resolve).catch(reject);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

// Get page 3 to find April/May dates
console.log('Fetching page 3...');
const html = await fetchText('https://antalyatuted.org.tr/Fiyat/Index?Sayfa=3');

// Extract all PDF links with dates
const pdfMatches = [...html.matchAll(/(\d{2}\.\d{2}\.\d{4})[^<]*<\/a>\s*\n?\s*.*?href="(\/file\/pdf\/[^"]+)"/g)];
const pdfSimple = [...html.matchAll(/\/file\/pdf\/([a-f0-9\-]+\.pdf)/g)].map(m => m[1]);
const dates = [...html.matchAll(/(\d{2}\.\d{2}\.\d{4})\s+Antalya/g)].map(m => m[1]);

console.log('Dates on page 3:', dates);
console.log('PDF filenames:', pdfSimple);

// Take first one - April 22 or nearby
const firstPdfUrl = `https://antalyatuted.org.tr/file/pdf/${pdfSimple[0]}`;
const firstDate = dates[0];
console.log(`\nDownloading PDF for ${firstDate}: ${firstPdfUrl}`);

const buffer = await fetchBinary(firstPdfUrl);
console.log(`Buffer size: ${buffer.length} bytes`);
console.log(`Signature (hex): ${buffer.slice(0, 8).toString('hex')}`);
console.log(`First 100 bytes as text: ${buffer.slice(0, 100).toString('latin1')}`);

// Try pdf-parse
try {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  console.log(`\nPDF pages: ${data.numpages}`);
  console.log(`\nFirst 2000 chars of text:\n${data.text.slice(0, 2000)}`);
} catch (e) {
  console.log('pdf-parse error:', e.message);
  // Check if it's really HTML
  const txt = buffer.slice(0, 500).toString('utf-8');
  console.log('First 500 chars:\n', txt);
}
