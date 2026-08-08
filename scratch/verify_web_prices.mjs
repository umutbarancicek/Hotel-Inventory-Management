import https from 'https';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import * as XLSX from 'xlsx';

// Dates to check:
// 10.06.2026, 12.06.2026, 15.06.2026, 17.06.2026, 22.07.2026
const checkDates = ['2026-06-10', '2026-06-12', '2026-06-15', '2026-06-17', '2026-07-22'];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchText(res.headers.location).then(resolve).catch(reject);
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchBinary(res.headers.location).then(resolve).catch(reject);
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

function parseTRDate(s) {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

// Build map
console.log('Fetching date list...');
const dateMap = {};
for (let p = 1; p <= 4; p++) {
  const url = p === 1 ? 'https://antalyatuted.org.tr/Fiyat/Index' : `https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${p}`;
  const html = await fetchText(url);
  const pdfs = [...html.matchAll(/\/file\/pdf\/([a-f0-9\-]+\.pdf)/g)].map(m => `https://antalyatuted.org.tr/file/pdf/${m[1]}`);
  const excels = [...html.matchAll(/Fiyat\/Index\?p=excel&id=(\d+)/g)].map(m => m[1]);
  const dates = [...html.matchAll(/(\d{2}\.\d{2}\.\d{4})\s+Antalya/g)].map(m => parseTRDate(m[1])).filter(Boolean);
  const n = Math.min(dates.length, pdfs.length);
  for (let i = 0; i < n; i++) {
    dateMap[dates[i]] = { pdf: pdfs[i], excel: excels[i] || null };
  }
}

async function parsePdfPrices(buffer) {
  const data = await pdfParse(buffer);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const prices = {};
  const lineRe = /^(.+?)(Kg|Adet|Bağ|Pk|Demet|\d+\s*Gr|\d+\s*Ml|Lt)\s*([\d\.]+,\d{2})$/i;
  for (const line of lines) {
    const m = line.match(lineRe);
    if (!m) continue;
    const name = m[1].trim().toUpperCase();
    const rawPrice = m[3].replace(/\./g, '').replace(',', '.');
    prices[name] = parseFloat(rawPrice);
  }
  return prices;
}

function parseExcelPrices(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const prices = {};
  for (const row of rows) {
    if (row.length < 5) continue;
    const name = String(row[2]).trim().toUpperCase();
    const rawPrice = String(row[4]).trim();
    if (!name || name === 'ÜRÜN ADI' || name === '') continue;
    prices[name] = parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));
  }
  return prices;
}

for (const d of checkDates) {
  const entry = dateMap[d];
  if (!entry) {
    console.log(`No entry found for ${d} on website`);
    continue;
  }
  console.log(`\nDate: ${d}`);
  
  if (entry.excel) {
    try {
      const buf = await fetchBinary(`https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=${entry.excel}`);
      if (buf.slice(0, 4).toString('hex').startsWith('504b')) {
        const prices = parseExcelPrices(buf);
        console.log('  Excel parsed Karpuz:', prices['KARPUZ'], 'Kavun:', prices['KAVUN']);
        continue;
      }
    } catch (e) {}
  }
  
  if (entry.pdf) {
    try {
      const buf = await fetchBinary(entry.pdf);
      const prices = await parsePdfPrices(buf);
      console.log('  PDF parsed Karpuz:', prices['KARPUZ'], 'Kavun:', prices['KAVUN']);
    } catch (e) {
      console.log(`  PDF error for ${d}:`, e.message);
    }
  }
}
