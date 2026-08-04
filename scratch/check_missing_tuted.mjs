// Check which dates in Ertaşlar data have no TÜTED coverage
// by fetching the TÜTED index and seeing which dates are missing

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// Ertaşlar Excel dates
const ertaslarDates = [
  '2026-04-30','2026-05-01','2026-05-06','2026-05-09','2026-05-12',
  '2026-05-31','2026-06-01','2026-06-11','2026-06-12','2026-06-13',
  '2026-06-14','2026-06-27','2026-07-01','2026-07-07','2026-07-09',
  '2026-07-10','2026-07-21','2026-07-22','2026-07-23','2026-07-25',
  '2026-07-27'
];

// Fetch TÜTED index - ALL pages
async function fetchTutedIndex() {
  const res = await fetch('https://antalyatuted.org.tr/Fiyat/Index', { headers: HEADERS });
  const html = await res.text();
  
  const regex = /<td>\s*(\d{2}\.\d{2}\.\d{4})\s*<\/td>[\s\S]*?href="(\/Fiyat\/Index\?p=excel&id=\d+)"/g;
  const dateMap = {};
  let match;
  while ((match = regex.exec(html)) !== null) {
    const [_, dStr, url] = match;
    const [d,m,y] = dStr.split('.');
    const iso = `${y}-${m}-${d}`;
    dateMap[iso] = { dStr, url };
  }
  return dateMap;
}

async function main() {
  console.log('Fetching TÜTED index...');
  const indexMap = await fetchTutedIndex();
  const indexDates = Object.keys(indexMap).sort();
  console.log(`TÜTED index has ${indexDates.length} dates`);
  console.log(`Oldest: ${indexDates[0]}, Newest: ${indexDates[indexDates.length-1]}`);

  console.log('\n=== ERTAŞLAR DATE COVERAGE ===');
  const missing = [];
  const found = [];

  for (const isoDate of ertaslarDates) {
    const [y,m,d] = isoDate.split('-');
    const ddmmyyyy = `${d}.${m}.${y}`;
    
    // Exact match
    if (indexMap[isoDate]) {
      found.push(ddmmyyyy);
      console.log(`✅ ${ddmmyyyy} — exact match in TÜTED`);
      continue;
    }
    
    // Closest prior date
    const prior = indexDates.filter(dt => dt <= isoDate).pop();
    if (prior) {
      const p = indexMap[prior];
      found.push(ddmmyyyy);
      console.log(`🔄 ${ddmmyyyy} — closest: ${p.dStr}`);
    } else {
      missing.push(ddmmyyyy);
      console.log(`❌ ${ddmmyyyy} — NO TÜTED DATA`);
    }
  }

  console.log('\n=== MISSING DATES (need manual download) ===');
  missing.forEach(d => console.log(`  ${d}`));
  console.log(`\nTotal missing: ${missing.length}`);
  console.log(`Total covered: ${found.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
