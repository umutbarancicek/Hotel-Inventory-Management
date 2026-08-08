/**
 * FULL TÜTED SYNC SCRIPT
 * 
 * 1. Fetch all pages from TÜTED website to build date → excelId map
 * 2. For each date in our DB, download the correct Excel file
 * 3. Parse prices and save to Firestore priceLists
 * 
 * Run: node scratch/sync_tuted_from_web.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
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

// The dates we need from our DB
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
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBinary(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Parse date string like "07.08.2026" to "2026-08-07"
function parseTRDate(dateStr) {
  const m = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// Build a map: "2026-08-04" -> excelId
async function buildDateToIdMap() {
  const dateMap = {};
  const totalPages = 47;
  
  console.log(`Scanning ${totalPages} pages on TÜTED website...`);
  
  for (let page = 1; page <= totalPages; page++) {
    const url = page === 1 
      ? 'https://antalyatuted.org.tr/Fiyat/Index'
      : `https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${page}`;
    
    try {
      const html = await fetchText(url);
      
      // Extract entries like: 04.08.2026 ... ?p=excel&id=38398
      const excelRegex = /Fiyat\/Index\?p=excel&id=(\d+)/g;
      const dateRegex = /(\d{2}\.\d{2}\.\d{4})\s+Antalya/g;
      
      const excelIds = [];
      let m;
      while ((m = excelRegex.exec(html)) !== null) {
        excelIds.push(m[1]);
      }
      
      const dates = [];
      while ((m = dateRegex.exec(html)) !== null) {
        dates.push(m[1]);
      }
      
      if (dates.length === excelIds.length) {
        dates.forEach((dateStr, i) => {
          const isoDate = parseTRDate(dateStr);
          if (isoDate) {
            dateMap[isoDate] = excelIds[i];
          }
        });
      } else {
        console.warn(`Page ${page}: dates(${dates.length}) != excelIds(${excelIds.length})`);
      }
      
      process.stdout.write(`\rPage ${page}/${totalPages} done. Found ${Object.keys(dateMap).length} dates so far.`);
      await sleep(300); // Be polite to their server
    } catch (err) {
      console.error(`\nError on page ${page}:`, err.message);
    }
  }
  
  console.log(`\nTotal dates found on website: ${Object.keys(dateMap).length}`);
  return dateMap;
}

// Parse Excel buffer and extract product prices
function parseExcelPrices(buffer) {
  try {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    
    const prices = {};
    
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 2) continue;
      
      // Find product name and price columns
      // Typical format: [#, ProductName, Unit, Price, ...]
      let productName = null;
      let price = null;
      
      for (let col = 0; col < row.length; col++) {
        const cell = String(row[col]).trim();
        if (!productName && cell && !/^\d+$/.test(cell) && isNaN(parseFloat(cell))) {
          // Looks like a product name
          if (cell.length > 2 && !cell.includes('Fiyat') && !cell.includes('Ürün') && !cell.includes('No')) {
            productName = cell.toUpperCase().trim();
          }
        } else if (productName && !price && cell && !isNaN(parseFloat(cell))) {
          const parsed = parseFloat(cell);
          if (parsed > 0 && parsed < 100000) {
            price = parsed;
          }
        }
      }
      
      if (productName && price && productName.length > 2) {
        prices[productName] = price;
      }
    }
    
    return prices;
  } catch (err) {
    console.error('Excel parse error:', err.message);
    return {};
  }
}

async function main() {
  // Step 1: Build date → Excel ID map from website
  const dateMap = await buildDateToIdMap();
  
  // Step 2: For each target date, find best matching Excel
  let successCount = 0;
  let fallbackCount = 0;
  let failCount = 0;
  
  const sortedWebDates = Object.keys(dateMap).sort();
  
  for (const targetDate of TARGET_DATES) {
    // Find exact match or closest prior date on the website
    let useDate = null;
    let useId = null;
    
    if (dateMap[targetDate]) {
      useDate = targetDate;
      useId = dateMap[targetDate];
    } else {
      // Find closest prior date
      const priorDates = sortedWebDates.filter(d => d <= targetDate);
      if (priorDates.length > 0) {
        useDate = priorDates[priorDates.length - 1];
        useId = dateMap[useDate];
        fallbackCount++;
        console.log(`\n[FALLBACK] ${targetDate} -> using ${useDate} (id=${useId})`);
      } else {
        failCount++;
        console.log(`\n[FAIL] ${targetDate}: no prior date found on website`);
        continue;
      }
    }
    
    // Download Excel
    try {
      const excelUrl = `https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=${useId}`;
      const buffer = await fetchBinary(excelUrl);
      
      const prices = parseExcelPrices(buffer);
      const priceCount = Object.keys(prices).length;
      
      if (priceCount === 0) {
        console.log(`\n[WARN] ${targetDate}: Excel parsed 0 prices (id=${useId}, size=${buffer.length})`);
        failCount++;
        continue;
      }
      
      // Save to Firestore
      await setDoc(doc(db, 'priceLists', targetDate), {
        prices,
        date: targetDate,
        sourceDate: useDate,
        sourceId: useId,
        fetchedAt: new Date().toISOString(),
        source: 'web'
      });
      
      successCount++;
      process.stdout.write(`\r[OK] ${targetDate} -> ${priceCount} prices saved (source: ${useDate})`);
      
      await sleep(400); // Polite delay
    } catch (err) {
      failCount++;
      console.log(`\n[ERROR] ${targetDate} (id=${useId}): ${err.message}`);
    }
  }
  
  console.log(`\n\n=== SYNC COMPLETE ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Fallback (used nearest prior date): ${fallbackCount}`);
  console.log(`Failed: ${failCount}`);
}

main().catch(console.error);
