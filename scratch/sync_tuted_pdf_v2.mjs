/**
 * TÜTED FULL SYNC via PDF (April-July 3) + Excel (July 4+)
 * Using pdf-parse@1.1.1
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import https from 'https';
import * as XLSX from 'xlsx';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const firebaseConfig = {
  apiKey: "AIzaSyA1Iv_1fkFSVI-P4Y_g1QlCgB4CMsRZJFI",
  authDomain: "miramor-inventory-management.firebaseapp.com",
  projectId: "miramor-inventory-management",
  storageBucket: "miramor-inventory-management.firebasestorage.app",
  messagingSenderId: "539349013423",
  appId: "1:539349013423:web:53cb425931b51b1530d55a"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MISSING_DATES = [
  '2026-04-24','2026-04-28','2026-04-29','2026-04-30',
  '2026-05-01','2026-05-04','2026-05-05','2026-05-06','2026-05-09','2026-05-11','2026-05-12','2026-05-15','2026-05-18','2026-05-20','2026-05-23','2026-05-24','2026-05-25','2026-05-30','2026-05-31',
  '2026-06-01','2026-06-03','2026-06-06','2026-06-08','2026-06-10','2026-06-11','2026-06-12','2026-06-13','2026-06-14','2026-06-15','2026-06-17','2026-06-20','2026-06-22','2026-06-23','2026-06-24','2026-06-27','2026-06-29','2026-06-30',
  '2026-07-01','2026-07-02','2026-07-03'
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchText(res.headers.location).then(resolve).catch(reject);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchBinary(res.headers.location).then(resolve).catch(reject);
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseTRDate(dateStr) {
  const m = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

async function buildDateMap() {
  const dateMap = {};
  for (let page = 1; page <= 4; page++) {
    const url = page === 1 ? 'https://antalyatuted.org.tr/Fiyat/Index' : `https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${page}`;
    try {
      const html = await fetchText(url);
      const pdfUrls = [...html.matchAll(/\/file\/pdf\/([a-f0-9\-]+\.pdf)/g)].map(m => `https://antalyatuted.org.tr/file/pdf/${m[1]}`);
      const excelIds = [...html.matchAll(/Fiyat\/Index\?p=excel&id=(\d+)/g)].map(m => m[1]);
      const dates = [...html.matchAll(/(\d{2}\.\d{2}\.\d{4})\s+Antalya/g)].map(m => parseTRDate(m[1])).filter(Boolean);
      const count = Math.min(dates.length, pdfUrls.length);
      for (let i = 0; i < count; i++) {
        dateMap[dates[i]] = { pdfUrl: pdfUrls[i], excelId: excelIds[i] || null };
      }
      console.log(`Page ${page}: ${count} entries. Total: ${Object.keys(dateMap).length}`);
      await sleep(200);
    } catch (err) {
      console.error(`Page ${page} error: ${err.message}`);
    }
  }
  return dateMap;
}

async function parsePdfPrices(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text;
    const prices = {};
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Pattern: "ÜRÜN ADI  Kg  300,00" or "ÜRÜN ADI  300,00"
      // Price always at end: digits with optional dots and exactly comma+2digits
      const priceMatch = line.match(/^(.+?)\s+([\d.]+,\d{2})\s*$/);
      if (!priceMatch) continue;
      
      let namePart = priceMatch[1].trim().toUpperCase();
      const rawPrice = priceMatch[2].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(rawPrice);
      
      if (!price || price <= 0 || price > 100000) continue;
      
      // Remove unit suffixes
      namePart = namePart
        .replace(/\s+(KG|ADET|BAĞ|PK|GR|ML|LT|PAKET|DEMET)\s*$/i, '')
        .replace(/\s+\d+\s*GR\s*$/i, '')
        .replace(/\s+\d+\s*ML\s*$/i, '')
        .trim();
      
      if (namePart.length > 1 && !/^[\d\s]+$/.test(namePart)) {
        prices[namePart] = price;
      }
    }
    return prices;
  } catch (err) {
    return {};
  }
}

function parseExcelPrices(buffer) {
  const sig = buffer.slice(0, 4).toString('hex');
  if (!sig.startsWith('504b')) return null;
  try {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const prices = {};
    for (const row of rows) {
      if (row.length < 5) continue;
      const name = String(row[2]).trim().toUpperCase();
      const rawPrice = String(row[4]).trim();
      if (!name || name === 'ÜRÜN ADI' || name === '') continue;
      const price = parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));
      if (name.length > 1 && !isNaN(price) && price > 0) prices[name] = price;
    }
    return prices;
  } catch (e) { return {}; }
}

async function main() {
  console.log('Building date map...');
  const dateMap = await buildDateMap();
  const sortedWebDates = Object.keys(dateMap).sort();
  console.log(`\nTotal: ${Object.keys(dateMap).length} dates mapped\n`);

  let success = 0, fallback = 0, skipped = 0;

  for (const targetDate of MISSING_DATES) {
    let useDate = dateMap[targetDate] ? targetDate : null;
    let entry = dateMap[targetDate] || null;

    if (!entry) {
      const prior = sortedWebDates.filter(d => d <= targetDate);
      if (prior.length > 0) {
        useDate = prior[prior.length - 1];
        entry = dateMap[useDate];
        fallback++;
        console.log(`[FALLBACK] ${targetDate} -> ${useDate}`);
      } else {
        skipped++;
        console.log(`[SKIP] ${targetDate}: no data`);
        continue;
      }
    }

    // Try Excel first, then PDF
    let prices = null;
    let method = '';

    if (entry.excelId) {
      try {
        const buf = await fetchBinary(`https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=${entry.excelId}`);
        prices = parseExcelPrices(buf);
        if (prices && Object.keys(prices).length > 10) method = 'excel';
        else prices = null;
      } catch (e) {}
    }

    if (!prices && entry.pdfUrl) {
      try {
        const buf = await fetchBinary(entry.pdfUrl);
        const sig = buf.slice(0, 4).toString('hex');
        if (sig === '25504446') { // %PDF
          prices = await parsePdfPrices(buf);
          if (prices && Object.keys(prices).length > 0) method = 'pdf';
          else prices = null;
        }
      } catch (e) {
        console.log(`[ERROR] ${targetDate} PDF: ${e.message}`);
      }
    }

    if (!prices || Object.keys(prices).length === 0) {
      skipped++;
      console.log(`[SKIP] ${targetDate}: 0 prices parsed`);
      continue;
    }

    await setDoc(doc(db, 'priceLists', targetDate), {
      prices,
      date: targetDate,
      sourceDate: useDate,
      fetchedAt: new Date().toISOString(),
      source: method
    });

    success++;
    console.log(`[OK] ${targetDate} -> ${Object.keys(prices).length} prices via ${method} (source: ${useDate})`);
    await sleep(400);
  }

  console.log(`\n=== DONE ===`);
  console.log(`✅ Success: ${success}`);
  console.log(`↩️  Fallback: ${fallback}`);
  console.log(`⏭️  Skipped: ${skipped}`);
}

main().catch(console.error);
