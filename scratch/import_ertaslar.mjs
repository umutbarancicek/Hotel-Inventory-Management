// Script to:
// 1. Fetch TÜTED price lists for all 21 dates in Ertaşlar Excel
// 2. Match each Excel row product to TÜTED price
// 3. Calculate supplyPrice = TÜTED_price * 1.82
// 4. Import all 1789 rows to Firebase as transactions for ERTAŞLAR

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

const MARGIN = 1.82; // tedarik = TÜTED * 1.82

// Ana Depo → Hotel name mapping
const depoToHotel = {
  'Ambassador Ana Depo': 'AMBASSADOR',
  'Astoria Ana Depo': 'ASTORİA',
  'Grand Miramor Ana Depo': 'GRAND MİRAMOR',
  'Miramor Garden Ana Depo': 'MİRAMOR GARDEN',
  'Seaphoria Ana Depo': 'SEAPHORİA',
  'Stella Ana Depo': 'STELLA',
};

// Read Excel
const filePath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', raw: false, dateNF: 'DD.MM.YYYY' });
const ws = wb.Sheets['Sheet'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'DD.MM.YYYY' });
const data = rows.slice(1).filter(r => r[0] && r[1] && r[4]); // skip empty rows

console.log(`Total rows: ${data.length}`);

// Get unique dates in DD.MM.YYYY format
const uniqueDates = [...new Set(data.map(r => r[0]))].sort((a, b) => {
  const [da,ma,ya] = a.split('.');
  const [db,mb,yb] = b.split('.');
  return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
});
console.log(`Unique dates: ${uniqueDates.join(', ')}`);

// Fetch TÜTED price list for a given date (DD.MM.YYYY)
async function fetchTuted(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('.');
  const isoDate = `${y}-${m}-${d}`;
  
  console.log(`\nFetching TÜTED for ${ddmmyyyy}...`);
  
  try {
    // Fetch the index page
    const indexRes = await fetch('https://proxy.cors.sh/https://antalyatuted.org.tr/Fiyat/Index', {
      headers: { 'x-cors-api-key': 'temp_b5b1e1e3b7f8a0a9e0a0e0a0e0a0e0a0' }
    });
    if (!indexRes.ok) throw new Error(`Index fetch failed: ${indexRes.status}`);
    const html = await indexRes.text();
    
    // Parse date→URL map
    const regex = /<td>\s*(\d{2}\.\d{2}\.\d{4})\s*<\/td>[\s\S]*?href="(\/Fiyat\/Index\?p=excel&id=\d+)"/g;
    const dateMap = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      const [_, dStr, url] = match;
      const [dd,mm,yy] = dStr.split('.');
      dateMap.push({ dStr, iso: `${yy}-${mm}-${dd}`, url });
    }
    
    // Find closest date on or before target
    let entry = dateMap.find(e => e.iso === isoDate || e.dStr === ddmmyyyy);
    if (!entry) {
      const sorted = dateMap.sort((a,b) => b.iso.localeCompare(a.iso));
      entry = sorted.find(e => e.iso <= isoDate) || sorted[0];
      if (entry) console.log(`  No exact match, using closest: ${entry.dStr}`);
    }
    
    if (!entry) throw new Error('No TÜTED entry found');
    
    // Download the Excel
    const excelUrl = 'https://proxy.cors.sh/https://antalyatuted.org.tr' + entry.url;
    const excelRes = await fetch(excelUrl, {
      headers: { 'x-cors-api-key': 'temp_b5b1e1e3b7f8a0a9e0a0e0a0e0a0e0a0' }
    });
    if (!excelRes.ok) throw new Error(`Excel fetch failed: ${excelRes.status}`);
    const arrayBuffer = await excelRes.arrayBuffer();
    
    const twb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const tws = twb.Sheets[twb.SheetNames[0]];
    const trows = XLSX.utils.sheet_to_json(tws, { header: 1 });
    
    // Build product→price map
    const priceMap = {};
    for (let i = 2; i < trows.length; i++) {
      const row = trows[i];
      if (!row || !row[2] || !row[4]) continue;
      const productName = row[2].toString().trim().toUpperCase();
      const priceStr = row[4].toString().replace(',', '.').trim();
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        priceMap[productName] = price;
      }
    }
    
    console.log(`  OK — ${Object.keys(priceMap).length} products found for ${entry.dStr}`);
    return { dateUsed: entry.dStr, isoUsed: entry.iso, priceMap };
    
  } catch (err) {
    console.error(`  FAILED for ${ddmmyyyy}: ${err.message}`);
    return null;
  }
}

// Parse Turkish number format: "1,234.56" or "1.234,56" or "1234"
function parseNum(str) {
  if (!str) return 0;
  const s = String(str).replace(/\s/g, '');
  // Remove thousands separator and normalize decimal
  const cleaned = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// Main
async function main() {
  // 1. Fetch TÜTED for all dates
  const tutedCache = {}; // DD.MM.YYYY → { priceMap }
  
  for (const date of uniqueDates) {
    const result = await fetchTuted(date);
    tutedCache[date] = result;
    // Small delay to be polite to server
    await new Promise(r => setTimeout(r, 800));
  }
  
  // 2. Build transactions
  let maxId = 0;
  const transactions = [];
  let missingTuted = 0;
  let missingProduct = 0;
  
  for (const row of data) {
    const [tarih, stokAdi, birim, miktarStr, birimFiyatStr, , , , anaDepo] = row;
    
    const hotel = depoToHotel[anaDepo] || anaDepo;
    const qty = parseNum(miktarStr);
    const buyPrice = parseNum(birimFiyatStr);
    
    if (qty <= 0 || buyPrice <= 0) continue;
    
    // Convert date DD.MM.YYYY → YYYY-MM-DD
    const [d, m, y] = tarih.split('.');
    const isoDate = `${y}-${m}-${d}`;
    
    // Find TÜTED price
    const tutedResult = tutedCache[tarih];
    let supplyPrice = 0;
    
    if (tutedResult && tutedResult.priceMap) {
      const productUpper = stokAdi.trim().toUpperCase();
      const tutedPrice = tutedResult.priceMap[productUpper];
      if (tutedPrice) {
        supplyPrice = Math.round(tutedPrice * MARGIN * 100) / 100;
      } else {
        // Try partial match
        const keys = Object.keys(tutedResult.priceMap);
        const partial = keys.find(k => k.includes(productUpper) || productUpper.includes(k));
        if (partial) {
          supplyPrice = Math.round(tutedResult.priceMap[partial] * MARGIN * 100) / 100;
        } else {
          missingProduct++;
          // fallback: use buyPrice * 1.82 as estimate
          supplyPrice = Math.round(buyPrice * MARGIN * 100) / 100;
        }
      }
    } else {
      missingTuted++;
      supplyPrice = Math.round(buyPrice * MARGIN * 100) / 100;
    }
    
    maxId++;
    transactions.push({
      id: Date.now() + maxId,
      date: isoDate,
      supplier: 'ERTAŞLAR',
      hotel: hotel,
      product: stokAdi.trim().toUpperCase(),
      qty: qty,
      buyPrice: buyPrice,
      supplyPrice: supplyPrice,
    });
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total transactions to import: ${transactions.length}`);
  console.log(`Rows with missing TÜTED date: ${missingTuted}`);
  console.log(`Rows with product not found in TÜTED: ${missingProduct}`);
  
  // Show sample
  console.log('\nSample transactions:');
  transactions.slice(0, 5).forEach(t => {
    console.log(`  ${t.date} | ${t.hotel} | ${t.product} | qty:${t.qty} | buyPrice:${t.buyPrice} | supplyPrice:${t.supplyPrice}`);
  });
  
  // 3. Save to Firebase
  console.log('\nSaving to Firebase...');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) { console.error('Firebase doc not found!'); process.exit(1); }
  
  const fbData = docSnap.data();
  // Get current max id
  const currentMaxId = fbData.transactions.reduce((m, t) => Math.max(m, t.id || 0), 0);
  // Reassign IDs to avoid conflicts
  transactions.forEach((t, i) => { t.id = currentMaxId + i + 1; });
  
  fbData.transactions.push(...transactions);
  await setDoc(docRef, fbData);
  
  console.log(`✅ Successfully imported ${transactions.length} transactions to Firebase!`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
