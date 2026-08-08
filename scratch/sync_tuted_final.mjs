/**
 * TÜTED SYNC - FINAL CORRECT VERSION
 * - Scans first 4 pages only
 * - Correct column indices: col[2]=product, col[4]=price (Turkish "300,00" format)
 * - Skips HTML-only old dates gracefully
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import https from 'https';
import * as XLSX from 'xlsx';

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

const TARGET_DATES = [
  '2026-04-24','2026-04-28','2026-04-29','2026-04-30',
  '2026-05-01','2026-05-04','2026-05-05','2026-05-06','2026-05-09','2026-05-11','2026-05-12','2026-05-15','2026-05-18','2026-05-20','2026-05-23','2026-05-24','2026-05-25','2026-05-30','2026-05-31',
  '2026-06-01','2026-06-03','2026-06-06','2026-06-08','2026-06-10','2026-06-11','2026-06-12','2026-06-13','2026-06-14','2026-06-15','2026-06-17','2026-06-20','2026-06-22','2026-06-23','2026-06-24','2026-06-27','2026-06-29','2026-06-30',
  '2026-07-01','2026-07-02','2026-07-03','2026-07-04','2026-07-06','2026-07-07','2026-07-08','2026-07-09','2026-07-10','2026-07-11','2026-07-13','2026-07-14','2026-07-15','2026-07-16','2026-07-18','2026-07-20','2026-07-21','2026-07-22','2026-07-23','2026-07-24','2026-07-25','2026-07-27','2026-07-29','2026-07-30',
  '2026-08-01','2026-08-03','2026-08-04','2026-08-05'
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
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseTRDate(dateStr) {
  const m = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

async function buildDateToIdMap() {
  const dateMap = {};
  for (let page = 1; page <= 4; page++) {
    const url = page === 1
      ? 'https://antalyatuted.org.tr/Fiyat/Index'
      : `https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${page}`;
    try {
      const html = await fetchText(url);
      const excelIds = [...html.matchAll(/Fiyat\/Index\?p=excel&id=(\d+)/g)].map(m => m[1]);
      const dates = [...html.matchAll(/(\d{2}\.\d{2}\.\d{4})\s+Antalya/g)].map(m => parseTRDate(m[1])).filter(Boolean);
      const count = Math.min(excelIds.length, dates.length);
      for (let i = 0; i < count; i++) dateMap[dates[i]] = excelIds[i];
      console.log(`Page ${page}: ${count} entries. Total: ${Object.keys(dateMap).length}`);
      await sleep(200);
    } catch (err) {
      console.error(`Page ${page} error: ${err.message}`);
    }
  }
  return dateMap;
}

function parseExcelPrices(buffer) {
  // Reject HTML responses
  const sig = buffer.slice(0, 4).toString('hex');
  if (!sig.startsWith('504b')) return null; // not XLSX

  try {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const items = [];
    for (const row of rows) {
      // Structure: [Category, DateNum, ProductName, Unit, "Price,00", ...]
      if (row.length < 5) continue;
      
      const name = String(row[2]).trim().toUpperCase();
      const unit = String(row[3]).trim();
      const rawPrice = String(row[4]).trim();
      
      // Skip header rows and empty rows
      if (!name || name === 'ÜRÜN ADI' || name === '' || name.includes('FİYAT')) continue;
      
      // Parse Turkish price format: "300,00" or "1.300,00"
      const priceStr = rawPrice.replace(/\./g, '').replace(',', '.');
      const price = parseFloat(priceStr);
      
      if (name.length > 1 && !isNaN(price) && price > 0 && price < 1000000) {
        items.push({ product: name, price, unit });
      }
    }
    return items;
  } catch (err) {
    return [];
  }
}

async function main() {
  console.log('Building date map from TÜTED website...');
  const dateMap = await buildDateToIdMap();
  const sortedWebDates = Object.keys(dateMap).sort();
  console.log(`\nMapped ${Object.keys(dateMap).length} dates. Range: ${sortedWebDates[sortedWebDates.length-1]} to ${sortedWebDates[0]}\n`);

  let success = 0, fallback = 0, skipped = 0;

  for (const targetDate of TARGET_DATES) {
    let useDate = dateMap[targetDate] ? targetDate : null;
    let useId = dateMap[targetDate] || null;

    if (!useId) {
      const prior = sortedWebDates.filter(d => d <= targetDate);
      if (prior.length > 0) {
        useDate = prior[prior.length - 1];
        useId = dateMap[useDate];
        fallback++;
        console.log(`[FALLBACK] ${targetDate} -> ${useDate}`);
      } else {
        skipped++;
        console.log(`[SKIP] ${targetDate}: no prior date on website`);
        continue;
      }
    }

    try {
      const buffer = await fetchBinary(`https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=${useId}`);
      const items = parseExcelPrices(buffer);

      if (items === null) {
        skipped++;
        console.log(`[SKIP] ${targetDate}: old record, Excel not available on website`);
        continue;
      }

      const count = items.length;
      if (count === 0) {
        skipped++;
        console.log(`[SKIP] ${targetDate}: Excel returned 0 prices`);
        continue;
      }

      await setDoc(doc(db, 'priceLists', targetDate), {
        items,
        date: targetDate,
        sourceDate: useDate,
        sourceId: useId,
        fetchedAt: new Date().toISOString(),
        source: 'web'
      });

      success++;
      console.log(`[OK] ${targetDate} -> ${count} prices (source: ${useDate})`);
      await sleep(300);
    } catch (err) {
      skipped++;
      console.log(`[ERROR] ${targetDate}: ${err.message}`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`✅ Success: ${success} dates saved`);
  console.log(`↩️  Fallback to prior date: ${fallback}`);
  console.log(`⏭️  Skipped (old/unavailable): ${skipped}`);
}

main().catch(console.error);
