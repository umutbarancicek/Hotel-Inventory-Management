/**
 * FULL REIMPORT + TÜTED UPDATE
 * 
 * 1. Desktop/tüted klasöründeki tüm PDF'leri parse et → Firestore priceLists'e kaydet
 * 2. Pivot raporu parse et (HAL + diğer tedarikçiler)
 * 3. Ertaşlar Excel'ini parse et (tek tek satırlar)
 * 4. Ertaşlar'ın her satırı için o tarihin TÜTED fiyatını bul → supplyPrice = TÜTED × marginRate
 * 5. Tüm transaction'ları Firestore'a yaz
 */

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { createRequire } from 'module';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, getDocs, collection } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

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

const TUTED_FOLDER = "C:\\Users\\Baran\\Desktop\\tüted";
const PIVOT_FILE = "C:\\Users\\Baran\\Desktop\\pivot_sevk_raporu_2026-08-04 (2).xlsx";
const ERTASLAR_FILE = "C:\\Users\\Baran\\Desktop\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function excelSerialToISO_swapped(serial) {
  // Pivot dosyasında serial tarihler gün/ay YER DEĞİŞTİRMİŞ
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${day}-${m}`; // SWAPPED
}

function excelSerialToISO_normal(serial) {
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

// PDF filename "DD.MM.pdf" → "2026-MM-DD"
function pdfFileNameToDate(filename) {
  const base = path.basename(filename, '.pdf');
  const parts = base.split('.');
  if (parts.length === 2) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `2026-${month}-${day}`;
  }
  return null;
}

function parseTRPrice(str) {
  if (!str) return null;
  const s = str.trim().replace(/\s/g, '');
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d+,\d+$/.test(s)) return parseFloat(s.replace(',', '.'));
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  return null;
}

function cleanStr(s) {
  return (s || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

function normalizeHotel(raw) {
  const u = cleanStr(raw);
  if (u.includes('GRAND') && (u.includes('MİRAMOR') || u.includes('MIRAMOR'))) return 'GRAND MİRAMOR';
  if (u.includes('SEAPHORIA') || u.includes('SEAPHORİA') || u.includes('SEPHORIA')) return 'SEAPHORİA';
  if (u.includes('CASAFORA')) return 'CASAFORA';
  if (u.includes('AMBASSADOR')) return 'AMBASSADOR';
  if ((u.includes('MİRAMOR') || u.includes('MIRAMOR')) && u.includes('GARDEN')) return 'MİRAMOR GARDEN';
  if (u.includes('STELLA')) return 'STELLA';
  if (u.includes('ASTORIA') || u.includes('ASTORİA')) return 'ASTORİA';
  return u.replace(' ANA DEPO', '').trim();
}

function normalizeProduct(raw) {
  const u = cleanStr(raw);
  const map = {
    'DOMATES CAM': 'DOMATES',
    'DOMATES TARLA': 'DOMATES',
    'KABAK TAZE': 'KABAK SAKIZ',
    'LAHANA BEYAZ': 'LAHANA',
    'SALATALIK SLOR': 'SALATALIK SİLOR PAKET',
    'BİBER KIL SİVRİ': 'BİBER SİVRİ',
    'BİBER DOLMALIK YEŞİL': 'BİBER DOLMA',
  };
  return map[u] || u;
}

function isSpecialHotel(hotel) {
  return hotel.includes('SEAPHORIA') || hotel.includes('SEAPHORİA') || hotel.includes('CASAFORA');
}

// ─── 1. PARSE TÜTED PDFs → Firestore priceLists ──────────────────────────────

async function parseTutedPdfsAndSave(dryRun = false) {
  const files = fs.readdirSync(TUTED_FOLDER).filter(f => f.endsWith('.pdf')).sort();
  console.log(`\nFound ${files.length} TÜTED PDFs: ${files.join(', ')}`);

  const results = {};

  for (const file of files) {
    const dateISO = pdfFileNameToDate(file);
    if (!dateISO) { console.log(`  Skipping ${file} (can't parse date)`); continue; }

    const filePath = path.join(TUTED_FOLDER, file);
    const dataBuffer = fs.readFileSync(filePath);

    try {
      const parser = new PDFParse(new Uint8Array(dataBuffer));
      const parsedData = await parser.getText();
      const lines = parsedData.text.split('\n');

      const prices = {};
      let foundSection = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Detect price section
        if (trimmed.toUpperCase().includes('ANTALYA') || trimmed.toUpperCase().includes('HAL MÜDÜRLÜĞÜ')) {
          foundSection = true;
        }

        // Parse tab-separated lines: PRODUCT \t UNIT \t ... \t PRICE
        const parts = line.split('\t').map(s => s.trim()).filter(s => s.length > 0);
        if (parts.length >= 3) {
          const prodName = parts[0].toUpperCase().trim();
          // Skip header/footer rows
          if (!prodName || /^\d/.test(prodName)) continue;
          if (['MAL ADI', 'ÜRÜN ADI', 'FİYAT', 'BİRİM', 'TOPLAM', 'ANTALYA', 'HAL', 'TARİH'].some(h => prodName.includes(h))) continue;
          if (prodName.length < 2 || prodName.length > 50) continue;

          // Price is in the last column
          const priceStr = parts[parts.length - 1];
          const price = parseTRPrice(priceStr);
          if (price && price > 0 && price < 50000) {
            prices[prodName] = price;
          }
        }
      }

      results[dateISO] = prices;
      console.log(`  ${dateISO} (${file}): ${Object.keys(prices).length} products parsed`);
      
      if (Object.keys(prices).length > 0) {
        // Show sample
        Object.entries(prices).slice(0, 3).forEach(([k, v]) => console.log(`    ${k}: ${v}`));
      } else {
        console.log(`    ⚠️  No products found! Showing first few lines:`);
        lines.slice(0, 10).filter(l => l.trim()).forEach(l => console.log(`    |${l}|`));
      }

    } catch (err) {
      console.error(`  Error parsing ${file}:`, err.message);
    }
  }

  if (!dryRun) {
    // Save each date as separate priceLists document
    for (const [dateISO, prices] of Object.entries(results)) {
      if (Object.keys(prices).length === 0) continue;
      const ref = doc(db, 'priceLists', dateISO);
      await setDoc(ref, { prices, source: 'local_pdf', parsedAt: new Date().toISOString() }, { merge: true });
      console.log(`  ✅ Saved priceLists/${dateISO}`);
    }
  }

  return results;
}

// ─── 2. LOAD ALL PRICE LISTS ─────────────────────────────────────────────────

async function loadAllPriceLists() {
  const snap = await getDocs(collection(db, 'priceLists'));
  const priceLists = {};
  snap.forEach(docSnap => {
    priceLists[docSnap.id] = docSnap.data().prices || {};
  });
  const sortedDates = Object.keys(priceLists).sort();
  console.log(`\nLoaded ${sortedDates.length} price list dates`);
  return { priceLists, sortedDates };
}

// TÜTED price aliases for product name matching
// Format: 'ERTAŞLAR_PRODUCT_NAME': ['TÜTED_LIST_KEY1', 'TÜTED_LIST_KEY2', ...]
const PRODUCT_ALIASES = {
  'DOMATES': ['DOMATES', 'DOMATES STANDART', 'DOMATES I.KAL', 'DOMATES I.KALİTE', 'SELE DOMATES'],
  'BİBER DOLMA': ['BİBER DOLMA', 'DOLMA BİBER', 'DOLMALIK BİBER', 'BİBER DOLMALIK'],
  'BİBER ÇARLİSTON': ['BİBER ÇARLİSTON', 'ÇARLİSTON BİBER', 'CHARLESTON BİBER', 'BİBER ÇARLİSTON'],
  'BİBER SİVRİ': ['BİBER SİVRİ', 'SİVRİ BİBER', 'BİBER KIL', 'BİBER KIL SİVRİ'],
  'BİBER KAPYA': ['BİBER KAPYA', 'KAPYA BİBER', 'KAPYA BİBERİ'],
  'BİBER KALİFORNİYA': ['BİBER KALİFORNİYA', 'KALİFORNİYA BİBER'],
  'PATLICAN': ['PATLICAN', 'KEMER PATLİCAN', 'YERLİ PATLİCAN'],
  // Ertaşlar uses 'SALATALIK' — maps to TÜTED 'SALATALIK SİLOR PAKET' or 'HIYAR YAYLA'
  'SALATALIK': ['SALATALIK', 'SALATALIK SİLOR PAKET', 'SİLOR SALATALIK', 'SALATALIK SİLOR', 'HIYAR YAYLA'],
  'SALATALIK SİLOR PAKET': ['SALATALIK SİLOR PAKET', 'SALATALIK', 'SİLOR SALATALIK', 'HIYAR YAYLA'],
  'KABAK SAKIZ': ['KABAK SAKIZ', 'KABAK', 'SAKIZ KABAK', 'YERLİ KABAK'],
  'KABAK SİYAH': ['KABAK SİYAH', 'KABAK', 'KABAK SAKIZ'],
  'DOMATES ÇERİ': ['DOMATES ÇERİ', 'KİRAZ DOMATES', 'CHERRY DOMATES', 'DOMATES CHERRY'],
  'DOMATES CHERRY': ['KİRAZ DOMATES', 'CHERRY DOMATES', 'DOMATES CHERRY', 'DOMATES ÇERİ'],
  'DOMATES PEMBE': ['PEMBE DOMATES', 'DOMATES PEMBE'],
  'DOMATES KOKTEYL': ['KOKTEYL DOMATES', 'DOMATES KOKTEYL'],
  'DOMATES BEEF': ['DOMATES BEEF', 'BEEFSTEAk DOMATES', 'DOMATES PEMBE', 'DOMATES'],
  'PORTAKAL SIKMALIK': ['PORTAKAL', 'SIKMALIK PORTAKAL', 'PORTAKAL SIKMALIK'],
  'ELMA GOLDEN': ['ELMA GOLDEN', 'GOLDEN ELMA', 'ELMA'],
  'ELMA STARKING': ['ELMA STARKING', 'STARKING ELMA'],
  'ELMA GRANNY SMİTH': ['ELMA GRANNY SMİTH', 'GRANNY SMITH', 'ELMA'],
  'ARMUT': ['ARMUT'],
  'NEKTARİN': ['NEKTARİN', 'NEKTARIN'],
  'ŞEFTALİ': ['ŞEFTALİ', 'SEFTALİ'],
  'ERİK': ['ERİK'],
  'ERİK ANJELİKA': ['ERİK ANJELİKA', 'ERİK'],
  'KAYISI': ['KAYISI'],
  'KİRAZ': ['KİRAZ'],
  'KARPUZ': ['KARPUZ'],
  'MARUL': ['MARUL', 'MARUL DÜZ'],
  'MARUL DÜZ': ['MARUL DÜZ', 'MARUL'],
  'MARUL KIVIRCIK': ['MARUL KIVIRCIK'],
  'MARUL POLOROSSO': ['MARUL POLOROSSO', 'MARUL LOLO ROSSO KIRMIZI', 'MARUL KIRMIZI'],
  'MARUL LOLO ROSSO KIRMIZI': ['MARUL LOLO ROSSO KIRMIZI', 'MARUL POLOROSSO', 'MARUL KIRMIZI'],
  'MARUL AYSBERG': ['MARUL AYSBERG', 'MARUL'],
  'MARUL KIRMIZI YAPRAK': ['MARUL KIRMIZI YAPRAK', 'MARUL POLOROSSO', 'MARUL'],
  'HAVUÇ': ['HAVUÇ'],
  'PATATES': ['PATATES', 'PATATES TAZE', 'PATATES BABY', 'PATATES KUMPİR'],
  'PATATES BABY': ['PATATES BABY', 'PATATES', 'PATATES TAZE'],
  'SOĞAN': ['SOĞAN', 'SOĞAN KIRMIZI', 'KIRMIZI SOĞAN'],
  'SOĞAN KIRMIZI': ['SOĞAN KIRMIZI', 'KIRMIZI SOĞAN', 'SOĞAN KURU'],
  'SOĞAN KURU': ['SOĞAN KURU', 'KURU SOĞAN', 'SOĞAN KIRMIZI'],
  'SARIMSAK KURU': ['SARIMSAK KURU', 'SARIMSAK'],
  'LAHANA': ['LAHANA', 'LAHANA BEYAZ', 'BEYAZ LAHANA', 'LAHANA KARADENİZ'],
  'LAHANA KIRMIZI': ['LAHANA KIRMIZI', 'KIRMIZI LAHANA'],
  'MISIR': ['MISIR', 'MISIR SOYULMUŞ', 'ŞEKER MISIRI'],
  'MISIR SOYULMUŞ': ['MISIR SOYULMUŞ', 'MISIR', 'ŞEKER MISIRI'],
  'ÇİLEK': ['ÇİLEK'],
  'DEREOTU': ['DEREOTU', 'DERE OTU'],
  'MAYDANOZ': ['MAYDANOZ', 'MAYDONOZ', 'MAYDANOZ FRENK', 'FRENK MAYDANOZU'],
  'MAYDANOZ FRENK': ['MAYDANOZ FRENK', 'MAYDONOZ FRENK', 'MAYDANOZ'],
  'NANE TAZE': ['NANE TAZE', 'NANE'],
  'ROKA': ['ROKA'],
  'SEMİZOTU': ['SEMİZOTU', 'SEMİZ OTU'],
  'TERE': ['TERE'],
  'FESLEĞEN': ['FESLEĞEN', 'FESLEYEN'],
  'KUZU KULAĞI': ['KUZU KULAĞI', 'KUZU KULAGI'],
  'PAZI': ['PAZI'],
  'PIRASA': ['PIRASA'],
  'TURP': ['TURP'],
  'PANCAR KIRMIZI': ['PANCAR KIRMIZI', 'KIRMIZI PANCAR', 'PANCAR'],
  'LİMON': ['LİMON'],
  'YABAN MERSİNİ': ['YABAN MERSİNİ', 'BLUEBERRY'],
  'BİBERİYE ROSEMARY PAKET': ['BİBERİYE', 'ROSEMARY'],
};

function getTutedPrice(priceLists, sortedDates, date, productName) {
  const priorDates = sortedDates.filter(d => d <= date);
  if (priorDates.length === 0) return null;
  
  const useDate = priorDates[priorDates.length - 1];
  const prices = priceLists[useDate] || {};
  const searchKey = productName.toUpperCase().trim();
  
  // Direct lookup
  if (prices[searchKey] !== undefined) return { price: prices[searchKey], fromDate: useDate };
  
  // Alias lookup
  const variants = PRODUCT_ALIASES[searchKey] || [searchKey];
  for (const variant of variants) {
    if (prices[variant] !== undefined) return { price: prices[variant], fromDate: useDate };
    // Partial match
    const matchKey = Object.keys(prices).find(k => k.includes(variant) || variant.includes(k));
    if (matchKey) return { price: prices[matchKey], fromDate: useDate };
  }
  
  // Fuzzy: first word match
  const firstWord = searchKey.split(' ')[0];
  if (firstWord.length > 3) {
    const matchKey = Object.keys(prices).find(k => k.startsWith(firstWord));
    if (matchKey) return { price: prices[matchKey], fromDate: useDate };
  }
  
  return null;
}

// ─── 3. PARSE PIVOT RAPORU ────────────────────────────────────────────────────

function parsePivotRaporu() {
  const buf = fs.readFileSync(PIVOT_FILE);
  const wb = XLSX.read(buf, { type: 'buffer', raw: true });
  const ws = wb.Sheets['Pivot Raporu'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

  const txs = [];
  let idCounter = 1786200000000;

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

    const halTutar = parseCurrencyPivot(r[5]);
    const tedarikTutar = parseCurrencyPivot(r[6]);

    const buyPrice = qty > 0 ? Math.round((halTutar / qty) * 100) / 100 : 0;
    const supplyPrice = qty > 0 ? Math.round((tedarikTutar / qty) * 100) / 100 : 0;

    txs.push({
      id: idCounter++,
      date,
      supplier: supplierRaw,
      hotel,
      product,
      qty,
      buyPrice,
      supplyPrice,
    });
  });

  return txs;
}

function parseCurrencyPivot(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/[₺\s\.]/g, '').replace(',', '.')) || 0;
}

// ─── 4. PARSE ERTAŞLAR ───────────────────────────────────────────────────────

function parseErtaslarExcel() {
  const buf = fs.readFileSync(ERTASLAR_FILE);
  const wb = XLSX.read(buf, { type: 'buffer', raw: true });
  const ws = wb.Sheets['Sheet'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  // Cols: Tarih, Stok Adı, Birim, Miktar, Birim Fiyat, Net Tutar, Kdv, Toplam, Ana Depo, Cari Adı

  const txs = [];
  let idCounter = 1786000000000;

  rows.slice(1).forEach(r => {
    if (!r[0] || !r[1] || !r[8]) return;
    const date = parseDateErtaslar(r[0]);
    const product = normalizeProduct(r[1]);
    const qty = parseFloat(r[3]) || 0;
    const buyPrice = parseFloat(r[4]) || 0;
    const hotel = normalizeHotel(r[8]);

    if (!date || qty <= 0 || buyPrice <= 0) return;

    txs.push({
      id: idCounter++,
      date,
      supplier: 'ERTAŞLAR',
      hotel,
      product,
      qty,
      buyPrice,
      supplyPrice: 0,  // to be filled
      tuted: 0,
    });
  });

  return txs;
}

// ─── 5. CALCULATE ERTAŞLAR SUPPLY PRICES ─────────────────────────────────────

function calcErtaslarSupplyPrices(txs, priceLists, sortedDates) {
  let found = 0, missing = 0;
  const missingLog = {};

  txs.forEach(tx => {
    if (tx.supplier !== 'ERTAŞLAR') return;
    const marginRate = isSpecialHotel(tx.hotel) ? 0.22 : 0.18;
    const result = getTutedPrice(priceLists, sortedDates, tx.date, tx.product);

    if (result) {
      tx.tuted = result.price;
      tx.tutedFromDate = result.fromDate;
      tx.supplyPrice = Math.round(result.price * marginRate * 100) / 100;
      found++;
    } else {
      tx.supplyPrice = Math.round(tx.buyPrice * marginRate * 100) / 100;
      tx.tutedMissing = true;
      missing++;
      const key = `${tx.date}|${tx.product}`;
      missingLog[key] = (missingLog[key] || 0) + 1;
    }
  });

  console.log(`\nTÜTED lookups: ✅ ${found} found, ❌ ${missing} not found`);
  if (missing > 0) {
    console.log('Missing:');
    Object.entries(missingLog).forEach(([k, c]) => console.log(`  ${k} (${c} rows)`));
  }
}

// ─── 6. WRITE TO FIREBASE ─────────────────────────────────────────────────────

async function writeTransactions(allTxs) {
  console.log('\nLoading current Firestore appData...');
  const appDataRef = doc(db, 'storage', 'appData');
  const snap = await getDoc(appDataRef);
  if (!snap.exists()) { console.error('❌ appData not found!'); return; }

  const currentData = snap.data();
  console.log(`  Current transactions: ${currentData.transactions?.length || 0}`);

  const newTxs = allTxs.map(tx => {
    const out = {
      id: tx.id,
      date: tx.date,
      supplier: tx.supplier,
      hotel: tx.hotel,
      product: tx.product,
      qty: tx.qty,
      buyPrice: tx.buyPrice,
      supplyPrice: tx.supplyPrice,
    };
    if (tx.tuted) out.tuted = tx.tuted;
    if (tx.tutedFromDate) out.tutedFromDate = tx.tutedFromDate;
    if (tx.tutedMissing) out.tutedMissing = true;
    return out;
  });

  const sizeKB = Math.round(JSON.stringify(newTxs).length / 1024);
  console.log(`  New transactions: ${newTxs.length} | Payload: ~${sizeKB} KB`);

  if (sizeKB > 900) {
    console.error(`  ❌ Payload too large! (${sizeKB} KB > 900 KB limit)`);
    return false;
  }

  await updateDoc(appDataRef, { transactions: newTxs });
  console.log(`  ✅ Saved ${newTxs.length} transactions!`);
  return true;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const DRY_RUN = process.argv.includes('--dry-run');
  if (DRY_RUN) console.log('=== DRY RUN MODE (no writes) ===');

  // Step 1: Parse and save TÜTED PDFs
  console.log('\n=== STEP 1: Parsing TÜTED PDFs ===');
  const localPrices = await parseTutedPdfsAndSave(DRY_RUN);

  // Step 2: Load all price lists (including existing + newly added)
  console.log('\n=== STEP 2: Loading price lists ===');
  const { priceLists, sortedDates } = await loadAllPriceLists();

  // Merge locally parsed (in case dry run)
  for (const [date, prices] of Object.entries(localPrices)) {
    if (!priceLists[date] || Object.keys(priceLists[date]).length === 0) {
      priceLists[date] = prices;
    }
  }
  const mergedSortedDates = Object.keys(priceLists).sort();
  console.log(`  Using ${mergedSortedDates.length} price list dates`);

  // Step 3: Parse pivot
  console.log('\n=== STEP 3: Parsing Pivot Raporu ===');
  const pivotTxs = parsePivotRaporu();
  console.log(`  ${pivotTxs.length} transactions`);

  // Step 4: Parse Ertaşlar
  console.log('\n=== STEP 4: Parsing Ertaşlar Excel ===');
  const ertaslarTxs = parseErtaslarExcel();
  console.log(`  ${ertaslarTxs.length} transactions`);

  // Step 5: Calculate supply prices
  console.log('\n=== STEP 5: Calculating supply prices ===');
  calcErtaslarSupplyPrices(ertaslarTxs, priceLists, mergedSortedDates);

  // Combine
  const allTxs = [...pivotTxs, ...ertaslarTxs];
  console.log(`\nTotal: ${allTxs.length} transactions`);

  // Show sample
  console.log('\n=== SAMPLE OUTPUT ===');
  console.log('Ertaşlar samples (with TÜTED):');
  ertaslarTxs.filter(t => t.tuted > 0).slice(0, 5).forEach(t => {
    const rate = isSpecialHotel(t.hotel) ? 0.22 : 0.18;
    console.log(`  ${t.date} | ${t.product} → ${t.hotel} | ${t.qty}kg | Buy:₺${t.buyPrice} | TÜTED:₺${t.tuted}(${t.tutedFromDate}) | Supply:₺${t.supplyPrice} [×${rate}]`);
  });
  console.log('\nErtaşlar MISSING TÜTED samples:');
  ertaslarTxs.filter(t => t.tutedMissing).slice(0, 3).forEach(t => {
    console.log(`  ${t.date} | ${t.product} → ${t.hotel} | TÜTED:MISSING`);
  });

  if (!DRY_RUN) {
    console.log('\n=== STEP 6: Writing to Firebase ===');
    await writeTransactions(allTxs);
  } else {
    const sizeKB = Math.round(JSON.stringify(allTxs).length / 1024);
    console.log(`\n=== DRY RUN: Estimated size ${sizeKB} KB ===`);
  }
}

main().catch(console.error);
