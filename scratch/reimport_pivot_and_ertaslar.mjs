/**
 * FULL REIMPORT SCRIPT
 * 
 * Kaynaklar:
 * 1. pivot_sevk_raporu_2026-08-04 (2).xlsx — Tüm HAL ve diğer tedarikçi verileri
 * 2. Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx — Ertaşlar verisi (her satır ayrı)
 * 
 * Ertaşlar için:
 *   supplyPrice = TÜTED_fiyatı × marginRate
 *   marginRate = Seaphoria/Casafora ise 0.22, diğerleri ise 0.18
 *   TÜTED = o tarih veya en yakın önceki tarihten alınır (priceLists collection)
 * 
 * Pivot için:
 *   buyPrice = Toplam HAL TUTAR / Toplam KİLO (zaten ağırlıklı ortalama, tek satır)
 *   supplyPrice = Toplam TEDARİK TUTAR / Toplam KİLO
 *   NOT: Pivot her tedarikçi/tarih/ürün/otel kombinasyonu için tek satır
 */

import fs from 'fs';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';

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

const PIVOT_FILE = "C:\\Users\\Baran\\Desktop\\pivot_sevk_raporu_2026-08-04 (2).xlsx";
const ERTASLAR_FILE = "C:\\Users\\Baran\\Desktop\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";

// ─── HELPERS ────────────────────────────────────────────────────────────────

// For PIVOT: serial dates have day/month SWAPPED (Excel format bug)
function excelSerialToISO_swapped(serial) {
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${day}-${m}`; // SWAPPED
}

// For ERTAŞLAR: serial dates are normal (no swap)
function excelSerialToISO_normal(serial) {
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // NORMAL
}

function parseDatePivot(val) {
  if (!val) return '';
  if (typeof val === 'number') return excelSerialToISO_swapped(val);
  const str = String(val).trim();
  if (/^\d{4,}\.\d+$/.test(str)) return excelSerialToISO_swapped(parseFloat(str));
  const parts = str.split('.');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return `${y}-${m}-${d}`;
  }
  return str;
}

function parseDateErtaslar(val) {
  if (!val) return '';
  if (typeof val === 'number') return excelSerialToISO_normal(val);
  const str = String(val).trim();
  if (/^\d+$/.test(str)) return excelSerialToISO_normal(parseInt(str));
  const parts = str.split('.');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return `${y}-${m}-${d}`;
  }
  return str;
}

function parseCurrency(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/[₺\s\.]/g, '').replace(',', '.')) || 0;
}

function cleanStr(s) {
  return (s || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

function normalizeHotel(raw) {
  const u = cleanStr(raw);
  if (u.includes('GRAND MİRAMOR') || (u.includes('GRAND') && u.includes('MIRAMOR'))) return 'GRAND MİRAMOR';
  if (u.includes('SEAPHORIA') || u.includes('SEAPHORİA') || u.includes('SEPHORIA')) return 'SEAPHORİA';
  if (u.includes('CASAFORA')) return 'CASAFORA';
  if (u.includes('AMBASSADOR')) return 'AMBASSADOR';
  if (u.includes('MİRAMOR GARDEN') || u.includes('MIRAMOR GARDEN') || u.includes('GARDEN')) return 'MİRAMOR GARDEN';
  if (u.includes('STELLA')) return 'STELLA';
  if (u.includes('ASTORIA') || u.includes('ASTORİA')) return 'ASTORİA';
  return u.replace(' ANA DEPO', '').trim();
}

function normalizeProduct(raw) {
  const u = cleanStr(raw);
  if (u === 'DOMATES CAM' || u === 'DOMATES TARLA') return 'DOMATES';
  if (u === 'KABAK TAZE') return 'KABAK SAKIZ';
  if (u === 'LAHANA BEYAZ') return 'LAHANA';
  if (u === 'SALATALIK SLOR') return 'SALATALIK SİLOR PAKET';
  if (u === 'BİBER KIL SİVRİ') return 'BİBER SİVRİ';
  if (u === 'BİBER DOLMALIK YEŞİL') return 'BİBER DOLMA';
  if (u === 'PORTAKAL') return 'PORTAKAL SIKMALIK';
  return u;
}

function isSpecialHotel(hotel) {
  return hotel.includes('SEAPHORIA') || hotel.includes('SEAPHORİA') || hotel.includes('CASAFORA');
}

// ─── STEP 1: LOAD PRICE LISTS FROM FIRESTORE ─────────────────────────────────
async function loadPriceLists() {
  console.log('Loading price lists from Firestore...');
  const snap = await getDocs(collection(db, 'priceLists'));
  const priceLists = {};
  snap.forEach(docSnap => {
    priceLists[docSnap.id] = docSnap.data().prices || {};
  });
  const sortedDates = Object.keys(priceLists).sort();
  console.log(`  Loaded ${sortedDates.length} price list dates: ${sortedDates[0]} to ${sortedDates[sortedDates.length-1]}`);
  return { priceLists, sortedDates };
}

function getTutedPrice(priceLists, sortedDates, date, productName) {
  // Find the exact or closest prior date
  const priorDates = sortedDates.filter(d => d <= date);
  if (priorDates.length === 0) return null;
  
  const useDate = priorDates[priorDates.length - 1];
  const prices = priceLists[useDate] || {};
  
  // Try to find product (case-insensitive, normalized)
  const searchKey = productName.toUpperCase().trim();
  
  // Direct lookup
  if (prices[searchKey] !== undefined) return { price: prices[searchKey], fromDate: useDate };
  
  // Try common aliases
  const aliases = {
    'DOMATES': ['DOMATES', 'DOMATES STANDART', 'DOMATES I.KALİTE', 'SELE DOMATES'],
    'BİBER DOLMA': ['BİBER DOLMALИК', 'BİBER DOLMA', 'DOLMA BİBERİ'],
    'BİBER ÇARLİSTON': ['ÇARLİSTON BİBER', 'BİBER ÇARLİSTON'],
    'BİBER SİVRİ': ['SİVRİ BİBER', 'BİBER SİVRİ'],
    'BİBER KAPYA': ['KAPYA BİBERİ', 'BİBER KAPYA', 'KAPYA'],
    'PATLICAN': ['PATLICAN', 'KEMER PATLİCAN'],
    'SALATALIK SİLOR PAKET': ['SALATALIK', 'SİLOR SALATALIK'],
    'KABAK SAKIZ': ['KABAK', 'SAKIZ KABAK', 'KABAK SAKIZ'],
    'DOMATES CHERRY': ['KİRAZ DOMATES', 'CHERRY DOMATES', 'DOMATES CHERRY'],
    'DOMATES PEMBE': ['PEMBE DOMATES', 'DOMATES PEMBE'],
    'PORTAKAL SIKMALIK': ['PORTAKAL', 'SIKIMALIK PORTAKAL'],
  };
  
  const variants = aliases[searchKey] || [searchKey];
  for (const variant of variants) {
    // Exact
    if (prices[variant] !== undefined) return { price: prices[variant], fromDate: useDate };
    // Partial match
    const matchKey = Object.keys(prices).find(k => k.includes(variant) || variant.includes(k));
    if (matchKey) return { price: prices[matchKey], fromDate: useDate };
  }
  
  return null;
}

// ─── STEP 2: PARSE PIVOT RAPORU ─────────────────────────────────────────────
function parsePivotRaporu() {
  const buf = fs.readFileSync(PIVOT_FILE);
  const wb = XLSX.read(buf, { type: 'buffer', raw: true });
  const ws = wb.Sheets['Pivot Raporu'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  
  const txs = [];
  let idCounter = 1;
  
  rows.slice(1).forEach(r => {
    if (!r[0] || !r[1] || !r[2] || !r[3]) return;
    const supplierRaw = cleanStr(r[0]);
    if (supplierRaw.includes('GENEL TOPLAM')) return;
    
    const date = parseDatePivot(r[1]);
    const product = normalizeProduct(r[2]);
    const hotel = normalizeHotel(r[3]);
    const qty = parseFloat(r[4]) || 0;
    
    if (!date || qty <= 0) return;
    if (product === 'MASRAF' || product === 'KDV') return;
    
    const halTutar = parseCurrency(r[5]);
    const tedarikTutar = parseCurrency(r[6]);
    
    const buyPrice = qty > 0 ? Math.round((halTutar / qty) * 100) / 100 : 0;
    const supplyPrice = qty > 0 ? Math.round((tedarikTutar / qty) * 100) / 100 : 0;
    
    txs.push({
      id: Date.now() + idCounter++,
      date,
      supplier: supplierRaw,
      hotel,
      product,
      qty,
      buyPrice,
      supplyPrice,
      source: 'PIVOT'
    });
  });
  
  return txs;
}

// ─── STEP 3: PARSE ERTAŞLAR (individual rows, TÜTED-based supply price) ──────
function parseErtaslarExcel() {
  const buf = fs.readFileSync(ERTASLAR_FILE);
  const wb = XLSX.read(buf, { type: 'buffer', raw: true });
  const ws = wb.Sheets['Sheet'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  
  const txs = [];
  let idCounter = 1000000;
  
  rows.slice(1).forEach(r => {
    // Cols: Tarih, Stok Adı, Birim, Miktar, Birim Fiyat, Net Tutar, Kdv, Toplam, Ana Depo, Cari Adı
    if (!r[0] || !r[1] || !r[8]) return;
    
    const date = parseDateErtaslar(r[0]);
    const product = normalizeProduct(r[1]);
    const qty = parseFloat(r[3]) || 0;
    const buyPrice = parseFloat(r[4]) || 0; // Birim Fiyat = unit price from Ertaşlar
    const hotel = normalizeHotel(r[8]);
    
    if (!date || qty <= 0 || buyPrice <= 0) return;
    
    // supplyPrice will be calculated after TÜTED lookup
    txs.push({
      id: Date.now() + idCounter++,
      date,
      supplier: 'ERTAŞLAR',
      hotel,
      product,
      qty,
      buyPrice, // Ertaşlar'ın sattığı fiyat (alış)
      supplyPrice: 0, // To be filled after TÜTED lookup
      tuted: 0,
      source: 'ERTASLAR'
    });
  });
  
  return txs;
}

// ─── STEP 4: CALCULATE SUPPLY PRICES FOR ERTAŞLAR ────────────────────────────
function calcErtaslarSupplyPrices(txs, priceLists, sortedDates) {
  let found = 0, notFound = 0;
  const notFoundMap = {};
  
  txs.forEach(tx => {
    if (tx.source !== 'ERTASLAR') return;
    
    const marginRate = isSpecialHotel(tx.hotel) ? 0.22 : 0.18;
    const result = getTutedPrice(priceLists, sortedDates, tx.date, tx.product);
    
    if (result) {
      tx.tuted = result.price;
      tx.supplyPrice = Math.round(result.price * marginRate * 100) / 100;
      tx.tutedFromDate = result.fromDate;
      found++;
    } else {
      // Fallback: use buyPrice as rough estimate, mark for review
      tx.supplyPrice = Math.round(tx.buyPrice * marginRate * 100) / 100;
      tx.tutedMissing = true;
      notFound++;
      const key = `${tx.date}|${tx.product}`;
      if (!notFoundMap[key]) notFoundMap[key] = 0;
      notFoundMap[key]++;
    }
  });
  
  console.log(`TÜTED lookups: ${found} found, ${notFound} not found`);
  if (notFound > 0) {
    console.log('Missing TÜTED mappings:');
    Object.entries(notFoundMap).slice(0, 20).forEach(([k, c]) => console.log(`  ${k} (${c} rows)`));
  }
  
  return txs;
}

// ─── STEP 5: WRITE TO FIREBASE ────────────────────────────────────────────────
async function writeToFirebase(allTxs) {
  console.log('\nLoading current appData from Firestore...');
  const appDataRef = doc(db, 'storage', 'appData');
  const snap = await getDoc(appDataRef);
  
  if (!snap.exists()) {
    console.error('ERROR: appData document not found!');
    return;
  }
  
  const appData = snap.data();
  console.log(`  Current transactions: ${appData.transactions?.length || 0}`);
  
  // Build new transactions array
  // Convert our flat tx objects to the format the app expects
  const newTxs = allTxs.map((tx, i) => ({
    id: tx.id || (Date.now() + i),
    date: tx.date,
    supplier: tx.supplier,
    hotel: tx.hotel,
    product: tx.product,
    qty: tx.qty,
    buyPrice: tx.buyPrice,
    supplyPrice: tx.supplyPrice,
    ...(tx.tuted ? { tuted: tx.tuted } : {}),
    ...(tx.tutedFromDate ? { tutedFromDate: tx.tutedFromDate } : {}),
    ...(tx.tutedMissing ? { tutedMissing: true } : {}),
  }));
  
  // Check size
  const payload = JSON.stringify(newTxs);
  const sizeKB = Math.round(payload.length / 1024);
  console.log(`  New transactions: ${newTxs.length}, size: ${sizeKB} KB`);
  
  if (sizeKB > 900) {
    console.error(`  ❌ Size too large (${sizeKB} KB) — would exceed Firestore 1MB limit!`);
    return;
  }
  
  // Save
  console.log('  Saving to Firestore...');
  await updateDoc(appDataRef, { transactions: newTxs });
  console.log(`  ✅ Saved ${newTxs.length} transactions successfully!`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const DRY_RUN = process.argv.includes('--dry-run');
  if (DRY_RUN) console.log('=== DRY RUN MODE (no writes) ===\n');
  
  // Load price lists
  const { priceLists, sortedDates } = await loadPriceLists();
  
  // Parse pivot raporu
  console.log('\nParsing Pivot Raporu...');
  const pivotTxs = parsePivotRaporu();
  console.log(`  ${pivotTxs.length} transactions`);
  
  // Parse ertaşlar
  console.log('\nParsing Ertaşlar Excel...');
  const ertaslarTxs = parseErtaslarExcel();
  console.log(`  ${ertaslarTxs.length} transactions (raw)`);
  
  // Calculate Ertaşlar supply prices
  console.log('\nCalculating TÜTED-based supply prices for Ertaşlar...');
  calcErtaslarSupplyPrices(ertaslarTxs, priceLists, sortedDates);
  
  // Combine all transactions
  const allTxs = [...pivotTxs, ...ertaslarTxs];
  console.log(`\nTotal combined: ${allTxs.length} transactions`);
  
  // Show sample
  console.log('\n=== SAMPLE OUTPUT ===');
  console.log('\nPivot samples:');
  pivotTxs.slice(0, 3).forEach(t => {
    console.log(`  ${t.date} | ${t.supplier} | ${t.product} -> ${t.hotel} | ${t.qty}kg | Buy:₺${t.buyPrice} | Supply:₺${t.supplyPrice}`);
  });
  
  console.log('\nErtaşlar samples:');
  ertaslarTxs.slice(0, 5).forEach(t => {
    const tutedStr = t.tuted ? `TÜTED:₺${t.tuted}` : 'TÜTED:MISSING';
    console.log(`  ${t.date} | ${t.product} -> ${t.hotel} | ${t.qty}kg | Buy:₺${t.buyPrice} | ${tutedStr} | Supply:₺${t.supplyPrice}`);
  });
  
  // Show date stats
  const pivotDates = [...new Set(pivotTxs.map(t => t.date))].sort();
  const ertDates = [...new Set(ertaslarTxs.map(t => t.date))].sort();
  console.log(`\nPivot date range: ${pivotDates[0]} to ${pivotDates[pivotDates.length-1]}`);
  console.log(`Ertaşlar date range: ${ertDates[0]} to ${ertDates[ertDates.length-1]}`);
  
  if (DRY_RUN) {
    console.log('\n=== DRY RUN — NO WRITES ===');
    const sizeKB = Math.round(JSON.stringify(allTxs).length / 1024);
    console.log(`Estimated payload size: ${sizeKB} KB`);
    return;
  }
  
  // Write to Firebase
  await writeToFirebase(allTxs);
}

main().catch(console.error);
