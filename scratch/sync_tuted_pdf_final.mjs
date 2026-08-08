/**
 * TÜTED FULL PDF SYNC - FINAL
 * PDF format: "BİBER KALİFORNİYAKg1.350,00" (no spaces between name/unit/price)
 * Pattern: text ending with (unit)(price) where unit = Kg/Adet/Bağ/Pk/etc
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import https from 'https';
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
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchBinary(res.headers.location).then(resolve).catch(reject);
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function parseTRDate(s) {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

async function buildDateMap() {
  const map = {};
  for (let p = 1; p <= 4; p++) {
    const url = p === 1 ? 'https://antalyatuted.org.tr/Fiyat/Index' : `https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${p}`;
    const html = await fetchText(url);
    const pdfs = [...html.matchAll(/\/file\/pdf\/([a-f0-9\-]+\.pdf)/g)].map(m => `https://antalyatuted.org.tr/file/pdf/${m[1]}`);
    const dates = [...html.matchAll(/(\d{2}\.\d{2}\.\d{4})\s+Antalya/g)].map(m => parseTRDate(m[1])).filter(Boolean);
    const n = Math.min(dates.length, pdfs.length);
    for (let i = 0; i < n; i++) map[dates[i]] = pdfs[i];
    console.log(`Page ${p}: ${n} entries. Total: ${Object.keys(map).length}`);
    await sleep(200);
  }
  return map;
}

// Parse PDF text where lines look like: "BİBER KALİFORNİYAKg1.350,00"
// Units: Kg, Adet, Bağ, Pk, (digits Gr), (digits Ml)
async function parsePdfPrices(buffer) {
  const data = await pdfParse(buffer);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items = [];

  // Regex: match "NAME<UNIT><PRICE>" where unit is Pk / 125 Gr, Pk, Kg, etc.
  const lineRe = /^(.+?)(Pk\s*\/\s*\d+\s*Gr|Pk\s*\/\s*\d+\s*Ml|\d+\s*Gr|\d+\s*Ml|Kg|Adet|Bağ|Pk|Demet|Lt|Ml|Gr)\s*([\d\.]+,\d{2})$/i;

  for (const line of lines) {
    const m = line.match(lineRe);
    if (!m) continue;
    
    const name = m[1].trim().toUpperCase();
    const unit = m[2].trim();
    const rawPrice = m[3].replace(/\./g, '').replace(',', '.');
    const price = parseFloat(rawPrice);
    
    if (name.length > 1 && !isNaN(price) && price > 0 && price < 100000) {
      items.push({ product: name, price, unit });
    }
  }
  return items;
}

async function main() {
  console.log('Building date map...');
  const dateMap = await buildDateMap();
  const sorted = Object.keys(dateMap).sort();
  console.log(`\nTotal: ${Object.keys(dateMap).length} dates. Earliest: ${sorted[sorted.length-1]}\n`);

  let success = 0, fallback = 0, skipped = 0;

  for (const targetDate of MISSING_DATES) {
    let useDate = dateMap[targetDate] ? targetDate : null;
    let pdfUrl = dateMap[targetDate] || null;

    if (!pdfUrl) {
      const prior = sorted.filter(d => d <= targetDate);
      if (prior.length > 0) {
        useDate = prior[prior.length - 1];
        pdfUrl = dateMap[useDate];
        fallback++;
        console.log(`[FALLBACK] ${targetDate} -> ${useDate}`);
      } else {
        skipped++;
        console.log(`[SKIP] ${targetDate}: no data`);
        continue;
      }
    }

    try {
      const buf = await fetchBinary(pdfUrl);
      const sig = buf.slice(0, 4).toString('hex');
      if (sig !== '25504446') {
        skipped++;
        console.log(`[SKIP] ${targetDate}: not a PDF (sig=${sig})`);
        continue;
      }

      const items = await parsePdfPrices(buf);
      const count = items.length;

      if (count === 0) {
        skipped++;
        console.log(`[SKIP] ${targetDate}: 0 prices`);
        continue;
      }

      await setDoc(doc(db, 'priceLists', targetDate), {
        items,
        date: targetDate,
        sourceDate: useDate,
        fetchedAt: new Date().toISOString(),
        source: 'pdf-web'
      });

      success++;
      console.log(`[OK] ${targetDate} -> ${count} prices (from ${useDate})`);
      await sleep(300);
    } catch (err) {
      skipped++;
      console.log(`[ERROR] ${targetDate}: ${err.message}`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`✅ Success: ${success}`);
  console.log(`↩️  Fallback: ${fallback}`);
  console.log(`⏭️  Skipped: ${skipped}`);
}

main().catch(console.error);
