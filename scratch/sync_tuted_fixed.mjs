/**
 * TÜTED SYNC - FIXED VERSION
 * - Only scans first 4 pages
 * - Properly parses XLSX files (PK/zip format)
 * - Falls back to closest prior date for missing dates
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import https from 'https';
import http from 'http';
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
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
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
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBinary(res.headers.location).then(resolve).catch(reject);
      }
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
  const PAGES_TO_SCAN = 4; // User confirmed all needed dates are in first 4 pages
  
  console.log(`Scanning first ${PAGES_TO_SCAN} pages...`);
  
  for (let page = 1; page <= PAGES_TO_SCAN; page++) {
    const url = page === 1
      ? 'https://antalyatuted.org.tr/Fiyat/Index'
      : `https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${page}`;
    
    try {
      const html = await fetchText(url);
      
      // Extract date + excel id pairs
      // Pattern: "04.08.2026 Antalya..." followed by "?p=excel&id=38398"
      const entryRegex = /(\d{2}\.\d{2}\.\d{4})\s+Antalya[^<]*<\/a>\s*\n?\s*<a[^>]*Fiyat\/Index\?p=excel&id=(\d+)/g;
      let m;
      let found = 0;
      while ((m = entryRegex.exec(html)) !== null) {
        const isoDate = parseTRDate(m[1]);
        if (isoDate) {
          dateMap[isoDate] = m[2];
          found++;
        }
      }
      
      // If the combined regex didn't work, try split approach
      if (found === 0) {
        const excelMatches = [...html.matchAll(/Fiyat\/Index\?p=excel&id=(\d+)/g)].map(m => m[1]);
        const dateMatches = [...html.matchAll(/(\d{2}\.\d{2}\.\d{4})\s+Antalya/g)].map(m => parseTRDate(m[1])).filter(Boolean);
        
        const count = Math.min(excelMatches.length, dateMatches.length);
        for (let i = 0; i < count; i++) {
          dateMap[dateMatches[i]] = excelMatches[i];
          found++;
        }
      }
      
      console.log(`Page ${page}: found ${found} entries. Total so far: ${Object.keys(dateMap).length}`);
      await sleep(200);
    } catch (err) {
      console.error(`Error on page ${page}: ${err.message}`);
    }
  }
  
  return dateMap;
}

function parseExcelPrices(buffer) {
  // File signature check: PK = ZIP = XLSX
  const sig = buffer.slice(0, 4).toString('hex');
  const isXLSX = sig.startsWith('504b'); // PK = ZIP header
  
  if (!isXLSX) {
    return null; // HTML or other non-Excel content
  }
  
  try {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    
    const prices = {};
    
    // Find header row to identify columns
    let productCol = -1;
    let priceCol = -1;
    
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i].map(c => String(c).trim().toUpperCase());
      // Look for header row
      const prodIdx = row.findIndex(c => c.includes('ÜRÜN') || c.includes('MAL') || c.includes('ÜRÜNÜN ADI'));
      const priceIdx = row.findIndex(c => c.includes('FİYAT') || c === 'FİYATI' || c.includes('SATIŞ'));
      
      if (prodIdx >= 0 && priceIdx >= 0) {
        productCol = prodIdx;
        priceCol = priceIdx;
        console.log(`  Header row at ${i}: product col=${prodIdx}, price col=${priceIdx}`);
        console.log(`  Sample header: ${JSON.stringify(row)}`);
        break;
      }
    }
    
    // If no header found, try to auto-detect columns
    if (productCol === -1) {
      // Try first few data rows to figure out structure
      for (let i = 0; i < Math.min(20, rows.length); i++) {
        const row = rows[i];
        const hasText = row.some(c => typeof c === 'string' && c.length > 2 && isNaN(parseFloat(c)));
        const hasNum = row.some(c => !isNaN(parseFloat(c)) && parseFloat(c) > 0);
        
        if (hasText && hasNum) {
          // Find first string and first number positions
          for (let col = 0; col < row.length; col++) {
            const cell = String(row[col]).trim();
            if (cell.length > 2 && isNaN(parseFloat(cell)) && 
                !cell.match(/^\d+$/) && !cell.includes('Sayfa') && !cell.includes('Tarih')) {
              productCol = col;
              // Find price after product
              for (let pc = col + 1; pc < row.length; pc++) {
                if (!isNaN(parseFloat(row[pc])) && parseFloat(row[pc]) > 0) {
                  priceCol = pc;
                  break;
                }
              }
              if (priceCol >= 0) break;
            }
          }
          if (productCol >= 0 && priceCol >= 0) break;
        }
      }
    }
    
    if (productCol < 0 || priceCol < 0) {
      // Last resort: log sample rows
      console.log('  Could not detect columns. Sample rows:');
      rows.slice(0, 10).forEach((r, i) => {
        if (r.some(c => c !== '')) console.log(`    row${i}: ${JSON.stringify(r)}`);
      });
      return {};
    }
    
    // Extract prices
    for (const row of rows) {
      if (!row[productCol] || !row[priceCol]) continue;
      
      const name = String(row[productCol]).trim().toUpperCase();
      const rawPrice = row[priceCol];
      const price = parseFloat(String(rawPrice).replace(',', '.'));
      
      if (name.length > 1 && !isNaN(price) && price > 0 && price < 100000) {
        prices[name] = price;
      }
    }
    
    return prices;
  } catch (err) {
    console.log(`  Parse error: ${err.message}`);
    return {};
  }
}

async function main() {
  // Step 1: Get date → Excel ID map from first 4 pages
  const dateMap = await buildDateToIdMap();
  const sortedWebDates = Object.keys(dateMap).sort();
  console.log(`\nTotal dates mapped: ${Object.keys(dateMap).length}`);
  console.log('Earliest:', sortedWebDates[sortedWebDates.length - 1]);
  console.log('Latest:', sortedWebDates[0]);
  
  // Step 2: Process each target date
  let success = 0, fallback = 0, skipped = 0;
  
  for (const targetDate of TARGET_DATES) {
    let useDate = dateMap[targetDate] ? targetDate : null;
    let useId = dateMap[targetDate] || null;
    
    if (!useId) {
      // Find closest prior date on website
      const prior = sortedWebDates.filter(d => d <= targetDate);
      if (prior.length > 0) {
        useDate = prior[prior.length - 1];
        useId = dateMap[useDate];
        fallback++;
        console.log(`[FALLBACK] ${targetDate} -> ${useDate}`);
      } else {
        skipped++;
        console.log(`[SKIP] ${targetDate}: no data available on website`);
        continue;
      }
    }
    
    try {
      const url = `https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=${useId}`;
      const buffer = await fetchBinary(url);
      
      // Check if it's real Excel or HTML
      const sig = buffer.slice(0, 4).toString('hex');
      if (!sig.startsWith('504b')) {
        skipped++;
        console.log(`[SKIP] ${targetDate}: server returned HTML instead of Excel (old data unavailable)`);
        continue;
      }
      
      const prices = parseExcelPrices(buffer);
      const count = Object.keys(prices).length;
      
      if (count === 0) {
        skipped++;
        console.log(`[SKIP] ${targetDate}: Excel parsed 0 prices`);
        continue;
      }
      
      await setDoc(doc(db, 'priceLists', targetDate), {
        prices,
        date: targetDate,
        sourceDate: useDate,
        sourceId: useId,
        fetchedAt: new Date().toISOString(),
        source: 'web'
      });
      
      success++;
      console.log(`[OK] ${targetDate} -> ${count} prices (from ${useDate})`);
      await sleep(300);
    } catch (err) {
      skipped++;
      console.log(`[ERROR] ${targetDate}: ${err.message}`);
    }
  }
  
  console.log('\n=== DONE ===');
  console.log(`✅ Success: ${success}`);
  console.log(`↩️  Fallback: ${fallback}`);
  console.log(`⏭️  Skipped: ${skipped}`);
}

main().catch(console.error);
