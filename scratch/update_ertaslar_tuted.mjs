// Script to:
// 1. Fetch real TÜTED prices for all 21 dates directly (no proxy)
// 2. Update supplyPrice of all ERTAŞLAR transactions in Firebase

import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

const MARGIN = 1.82;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// Fetch TÜTED index → map of date → excel url
async function fetchTutedIndex() {
  const res = await fetch('https://antalyatuted.org.tr/Fiyat/Index', { headers: HEADERS });
  if (!res.ok) throw new Error(`Index failed: ${res.status}`);
  const html = await res.text();
  
  const regex = /<td>\s*(\d{2}\.\d{2}\.\d{4})\s*<\/td>[\s\S]*?href="(\/Fiyat\/Index\?p=excel&id=\d+)"/g;
  const dateMap = {};
  let match;
  while ((match = regex.exec(html)) !== null) {
    const [_, dStr, url] = match;
    const [d,m,y] = dStr.split('.');
    const iso = `${y}-${m}-${d}`;
    dateMap[iso] = { dStr, iso, url };
  }
  console.log(`Index: found ${Object.keys(dateMap).length} dates`);
  return dateMap;
}

// Fetch TÜTED Excel for a given URL → product→price map
async function fetchTutedExcel(url) {
  const res = await fetch('https://antalyatuted.org.tr' + url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Excel failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  const priceMap = {};
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[2] || !row[4]) continue;
    const name = row[2].toString().trim().toUpperCase();
    const priceStr = row[4].toString().replace(',', '.').trim();
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price > 0) priceMap[name] = price;
  }
  return priceMap;
}

async function main() {
  // 1. Fetch index
  console.log('Fetching TÜTED index...');
  const indexMap = await fetchTutedIndex();

  // Unique dates we need (from ERTAŞLAR data)
  const dates = [
    '2026-04-30','2026-05-01','2026-05-06','2026-05-09','2026-05-12',
    '2026-05-31','2026-06-01','2026-06-11','2026-06-12','2026-06-13',
    '2026-06-14','2026-06-27','2026-07-01','2026-07-07','2026-07-09',
    '2026-07-10','2026-07-21','2026-07-22','2026-07-23','2026-07-25',
    '2026-07-27'
  ];

  // 2. Fetch TÜTED for each date (use closest available if exact not found)
  const tutedByDate = {}; // isoDate → priceMap
  const sortedIndexDates = Object.keys(indexMap).sort();

  for (const isoDate of dates) {
    // Find exact or closest prior date in index
    let entry = indexMap[isoDate];
    if (!entry) {
      // Find closest date on or before target
      const prior = sortedIndexDates.filter(d => d <= isoDate).pop();
      if (prior) {
        entry = indexMap[prior];
        console.log(`${isoDate}: no exact match, using ${prior}`);
      }
    }

    if (!entry) {
      console.log(`${isoDate}: no TÜTED data available, skipping`);
      tutedByDate[isoDate] = null;
      continue;
    }

    try {
      console.log(`Fetching ${isoDate} → TÜTED ${entry.dStr}...`);
      const priceMap = await fetchTutedExcel(entry.url);
      tutedByDate[isoDate] = priceMap;
      console.log(`  OK — ${Object.keys(priceMap).length} products`);
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      tutedByDate[isoDate] = null;
    }
  }

  // 3. Load Firebase data
  console.log('\nLoading Firebase...');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) { console.error('Firebase doc not found!'); process.exit(1); }
  const fbData = docSnap.data();

  // 4. Update supplyPrice for ERTAŞLAR transactions
  let updated = 0;
  let noTuted = 0;
  let noProduct = 0;
  const notFound = new Set();

  fbData.transactions.forEach(tx => {
    if (tx.supplier !== 'ERTAŞLAR') return;

    const priceMap = tutedByDate[tx.date];
    if (!priceMap) { noTuted++; return; }

    const productUpper = (tx.product || '').trim().toUpperCase();
    let tutedPrice = priceMap[productUpper];

    if (!tutedPrice) {
      // Try partial match
      const keys = Object.keys(priceMap);
      const partial = keys.find(k => k.includes(productUpper) || productUpper.includes(k));
      if (partial) {
        tutedPrice = priceMap[partial];
        console.log(`  Partial match: "${productUpper}" → "${partial}"`);
      }
    }

    if (tutedPrice) {
      tx.supplyPrice = Math.round(tutedPrice * MARGIN * 100) / 100;
      updated++;
    } else {
      notFound.add(productUpper);
      noProduct++;
      // Keep existing fallback (buyPrice * 1.82)
    }
  });

  console.log(`\n=== UPDATE SUMMARY ===`);
  console.log(`Updated with real TÜTED price: ${updated}`);
  console.log(`No TÜTED data for date: ${noTuted}`);
  console.log(`Product not found in TÜTED: ${noProduct}`);
  if (notFound.size > 0) {
    console.log(`Products not matched in TÜTED:`);
    [...notFound].sort().forEach(p => console.log(`  "${p}"`));
  }

  // 5. Save back to Firebase
  console.log('\nSaving to Firebase...');
  await setDoc(docRef, fbData);
  console.log('✅ Done! supplyPrices updated with real TÜTED data.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
