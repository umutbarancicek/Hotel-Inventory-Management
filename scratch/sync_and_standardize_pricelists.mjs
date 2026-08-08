/**
 * SCRAPE AND STANDARDIZE ALL PRICE LISTS
 * 
 * 1. Build date map of all PDFs from TÜTED site
 * 2. Parse all PDF dates (April 24 - July 3) with the new regex
 * 3. Store them in Firestore collection in standard format: { items: [{product, price, unit}], date, ... }
 * 4. Build a master product -> unit dictionary from PDF parses
 * 5. Fetch all July+ documents and convert them to standard items array using the dictionary
 * 6. Save all standardized documents back to the collection
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
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

const PDF_DATES = [
  '2026-04-24','2026-04-28','2026-04-29','2026-04-30',
  '2026-05-01','2026-05-04','2026-05-05','2026-05-06','2026-05-09','2026-05-11','2026-05-12','2026-05-15','2026-05-18','2026-05-20','2026-05-23','2026-05-24','2026-05-25','2026-05-30','2026-05-31',
  '2026-06-01','2026-06-03','2026-06-06','2026-06-08','2026-06-10','2026-06-11','2026-06-12','2026-06-13','2026-06-14','2026-06-15','2026-06-17','2026-06-20','2026-06-22','2026-06-23','2026-06-24','2026-06-27','2026-06-29','2026-06-30',
  '2026-07-01','2026-07-02','2026-07-03'
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchText(res.headers.location).then(resolve).catch(reject);
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchBinary(res.headers.location).then(resolve).catch(reject);
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function parseTRDate(s) {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

// Scrape dates list
async function buildDateMap() {
  const map = {};
  for (let p = 1; p <= 4; p++) {
    const url = p === 1 ? 'https://antalyatuted.org.tr/Fiyat/Index' : `https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${p}`;
    const html = await fetchText(url);
    const pdfs = [...html.matchAll(/\/file\/pdf\/([a-f0-9\-]+\.pdf)/g)].map(m => `https://antalyatuted.org.tr/file/pdf/${m[1]}`);
    const dates = [...html.matchAll(/(\d{2}\.\d{2}\.\d{4})\s+Antalya/g)].map(m => parseTRDate(m[1])).filter(Boolean);
    const n = Math.min(dates.length, pdfs.length);
    for (let i = 0; i < n; i++) map[dates[i]] = pdfs[i];
    await sleep(150);
  }
  return map;
}

async function main() {
  console.log('Building date map...');
  const dateMap = await buildDateMap();
  const sorted = Object.keys(dateMap).sort();

  const masterUnits = {};
  const pdfPriceLists = {};

  // Regex to match Unit cleanly (Pk / 125 Gr, 250 Gr, Adet, Kg etc.)
  const lineRe = /^(.+?)(Pk\s*\/\s*\d+\s*Gr|Pk\s*\/\s*\d+\s*Ml|\d+\s*Gr|\d+\s*Ml|Kg|Adet|Bağ|Pk|Demet|Lt|Ml|Gr)\s*([\d\.]+,\d{2})$/i;

  console.log('\n--- Parsing PDF Price Lists ---');
  for (const targetDate of PDF_DATES) {
    let useDate = dateMap[targetDate] ? targetDate : null;
    let pdfUrl = dateMap[targetDate] || null;

    if (!pdfUrl) {
      const prior = sorted.filter(d => d <= targetDate);
      if (prior.length > 0) {
        useDate = prior[prior.length - 1];
        pdfUrl = dateMap[useDate];
      } else {
        console.log(`[SKIP] ${targetDate}: no data`);
        continue;
      }
    }

    try {
      const buf = await fetchBinary(pdfUrl);
      const data = await pdfParse(buf);
      const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const items = [];
      for (const line of lines) {
        const m = line.match(lineRe);
        if (!m) continue;
        
        const name = m[1].trim().toUpperCase();
        const unit = m[2].trim();
        const rawPrice = m[3].replace(/\./g, '').replace(',', '.');
        const price = parseFloat(rawPrice);
        
        if (name.length > 1 && !isNaN(price)) {
          items.push({ product: name, price, unit });
          masterUnits[name] = unit;
        }
      }
      
      pdfPriceLists[targetDate] = {
        items,
        date: targetDate,
        sourceDate: useDate,
        fetchedAt: new Date().toISOString(),
        source: 'pdf-web'
      };
      console.log(`[PARSED] ${targetDate} -> ${items.length} items (using PDF from ${useDate})`);
      await sleep(100);
    } catch (e) {
      console.error(`[ERROR] ${targetDate}:`, e.message);
    }
  }

  // Master unit check
  console.log(`\nMaster units dictionary populated with ${Object.keys(masterUnits).length} products.`);
  console.log('Sample units:');
  console.log('  BLUE BERRY:     ', masterUnits['BLUE BERRY']);
  console.log('  ALTIN ÇİLEK:    ', masterUnits['ALTIN ÇİLEK']);
  console.log('  AHUDUDU:        ', masterUnits['AHUDUDU']);
  console.log('  KABAK MİNİ:     ', masterUnits['KABAK MİNİ']);
  console.log('  MAYDONOZ FRENK: ', masterUnits['MAYDONOZ FRENK']);

  // Fetch all July+ priceLists from collection to convert them
  console.log('\n--- Converting July+ Price Lists ---');
  const collectionSnap = await getDocs(collection(db, 'priceLists'));
  const allDocs = [];
  collectionSnap.forEach(d => { allDocs.push({ id: d.id, data: d.data() }); });

  for (const docObj of allDocs) {
    const docId = docObj.id;
    const docData = docObj.data;

    // If it's a PDF date, we overwrite with our newly parsed correct PDF list
    if (pdfPriceLists[docId]) {
      console.log(`[WRITING PDF] ${docId}...`);
      await setDoc(doc(db, 'priceLists', docId), pdfPriceLists[docId]);
      continue;
    }

    // Convert map to array format using the master units dictionary
    if (docData.prices && typeof docData.prices === 'object') {
      const items = Object.keys(docData.prices).map(prod => {
        const name = prod.toUpperCase().trim();
        // Look up unit, default to Kg
        const unit = masterUnits[name] || 'Kg';
        return {
          product: name,
          price: docData.prices[prod],
          unit: unit
        };
      });

      console.log(`[CONVERTING MAP] ${docId} -> ${items.length} items`);
      await setDoc(doc(db, 'priceLists', docId), {
        items,
        date: docId,
        fetchedAt: docData.fetchedAt || new Date().toISOString(),
        source: docData.source || 'web',
        sourceDate: docData.sourceDate || docId,
        sourceId: docData.sourceId || ''
      });
    } else {
      console.log(`[ALREADY STD] ${docId} has items array`);
    }
  }

  console.log('\n✅ Done standardizing all price list documents!');
}

main().catch(console.error);
