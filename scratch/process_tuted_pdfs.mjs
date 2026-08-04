import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

const MARGIN = 1.82;
const pdfFolder = 'C:\\Users\\Baran\\Desktop\\tüted';

// Map date (YYYY-MM-DD) to PDF file name
const dateToPdfFile = {
  '2026-04-30': '30.04.pdf',
  '2026-05-01': '01.05.pdf',
  '2026-05-06': '06.05.pdf',
  '2026-05-09': '09.05.pdf',
  '2026-05-12': '12.05.pdf',
  '2026-05-31': '30.05.pdf', // Sunday -> Saturday 30.05
  '2026-06-01': '01.06.pdf',
  '2026-06-11': '11.06.pdf',
  '2026-06-12': '12.06.pdf',
  '2026-06-13': '13.06.pdf',
  '2026-06-14': '13.06.pdf', // Sunday -> Saturday 13.06
  '2026-06-27': '27.06.pdf',
};

// Custom product name mappings between Ertaşlar Excel names and TÜTED PDF/web names
const productAliases = {
  'DOMATES CAM': ['DOMATES', 'DOMATES CAM'],
  'DOMATES BEEF': ['DOMATES BEEF'],
  'DOMATES KOKTEYL': ['DOMATES KOKTEYL', 'DOMATES KOKTEL'],
  'DOMATES ÇERİ': ['DOMATES CHERRY', 'DOMATES ÇERİ', 'DOMATES CHERY'],
  'BİBER DOLMALIK YEŞİL': ['BİBER DOLMA', 'BİBER DOLMALIK YEŞİL'],
  'BİBER KALİFORNİYA': ['BİBER KALİFORNİYA'],
  'BİBER KAPYA': ['BİBER KAPYA'],
  'BİBER KIL SİVRİ': ['BİBER KIL SİVRİ', 'BİBER SİVRİ'],
  'BİBER SİVRİ': ['BİBER SİVRİ'],
  'BİBER ÇARLİSTON': ['BİBER ÇARLİSTON'],
  'ELMA GOLDEN': ['ELMA GOLDEN'],
  'ELMA GRANNY SMİTH': ['ELMA GRANNY SMİTH', 'ELMA GREEN', 'ELMA GRANNY'],
  'ELMA KIRMIZI': ['ELMA STARKING', 'ELMA KIRMIZI'],
  'KABAK TAZE': ['KABAK SAKIZ', 'KABAK TAZE', 'KABAK'],
  'KABAK BAL': ['KABAK BAL DEKORLUK', 'KABAK BAL'],
  'KABAK DEKORLUK': ['KABAK BAL DEKORLUK', 'KABAK DEKORLUK'],
  'KABAK MİNİ': ['KABAK SAKIZ', 'KABAK MİNİ'],
  'KABAK SİYAH': ['KABAK SAKIZ', 'KABAK SİYAH'],
  'MARUL AYSBERG': ['MARUL AYSBERG', 'AYSBERG'],
  'MARUL DÜZ': ['MARUL DÜZ', 'MARUL'],
  'MARUL KIRMIZI YAPRAK': ['MARUL KIRMIZI YAPRAK', 'KIRMIZI YAPRAK'],
  'MARUL KIVIRCIK': ['MARUL KIVIRCIK'],
  'MARUL LOLO ROSSO KIRMIZI': ['MARUL LOLO ROSSO', 'POLOROSSO', 'MARUL LOLO ROSSO KIRMIZI'],
  'MARUL POLOROSSO': ['POLOROSSO', 'MARUL POLOROSSO'],
  'PATATES': ['PATATES TAZE', 'PATATES'],
  'PATATES BABY': ['PATATES BABY'],
  'PATATES KUMPİR': ['PATATES KUMPİR'],
  'PORTAKAL MEYVELİK': ['PORTAKAL MEYVELİK PAKET', 'PORTAKAL MEYVELİK', 'PORTAKAL'],
  'PORTAKAL SIKMALIK': ['PORTAKAL SIKMALIK'],
  'SALATALIK': ['HIYAR YAYLA', 'SALATALIK', 'HIYAR'],
  'SALATALIK SLOR': ['SALATALIK SİLOR PAKET', 'SALATALIK SİLOR', 'SALATALIK SLOR'],
  'SOĞAN KURU': ['SOĞAN KURU'],
  'SOĞAN KIRMIZI': ['SOĞAN KIRMIZI'],
  'SOĞAN TAZE': ['SOĞAN TAZE'],
  'SOĞAN FRENK': ['SOĞAN FRENK', 'SOĞAN ARPACIK'],
  'TURP': ['TURP KIRMIZI', 'TURP'],
  'TURP JAPON': ['TURP JAPON'],
  'MAYDANOZ': ['MAYDANOZ'],
  'DEREOTU': ['DEREOTU'],
  'NANE TAZE': ['NANE', 'NANE TAZE'],
  'ROKA': ['ROKA'],
  'TERE': ['TERE'],
  'SEMİZOTU': ['SEMİZOTU'],
  'ISPANAK TAZE': ['ISPANAK', 'ISPANAK TAZE'],
  'LAHANA BEYAZ': ['LAHANA BEYAZ'],
  'LAHANA KIRMIZI': ['LAHANA KIRMIZI'],
  'KARNABAHAR': ['KARNABAHAR'],
  'KEREVİZ': ['KEREVİZ'],
  'SARIMSAK KURU': ['SARIMSAK KURU'],
  'ARMUT': ['ARMUT SANDAMARİA', 'ARMUT'],
  'CHERRY': ['DOMATES CHERRY'],
  'GREYFURT': ['GREYFURT'],
  'LİMON': ['LİMON'],
  'MUZ YERLİ': ['MUZ YERLİ', 'MUZ'],
  'ÇİLEK': ['ÇİLEK'],
  'KARPUZ': ['KARPUZ'],
};

// Function to parse PDF content into product price map
async function parsePdfFile(filename) {
  const filePath = path.join(pdfFolder, filename);
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();
  
  const priceMap = {};
  const lines = data.text.split('\n');
  
  for (const line of lines) {
    // Expected format: "PRODUCT NAME \t Unit \t Price"
    const parts = line.split('\t').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const prodName = parts[0].toUpperCase();
      const priceStr = parts[parts.length - 1].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        priceMap[prodName] = price;
      }
    }
  }
  return priceMap;
}

// Function to fetch TÜTED web price list for web dates
async function fetchTutedWebIndex() {
  const res = await fetch('https://antalyatuted.org.tr/Fiyat/Index', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const regex = /<td>\s*(\d{2}\.\d{2}\.\d{4})\s*<\/td>[\s\S]*?href="(\/Fiyat\/Index\?p=excel&id=\d+)"/g;
  const dateMap = {};
  let match;
  while ((match = regex.exec(html)) !== null) {
    const [_, dStr, url] = match;
    const [d,m,y] = dStr.split('.');
    dateMap[`${y}-${m}-${d}`] = { dStr, url };
  }
  return dateMap;
}

async function fetchTutedWebExcel(url) {
  const res = await fetch('https://antalyatuted.org.tr' + url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
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

function findMatchingPrice(ertName, priceMap) {
  const ertUpper = ertName.trim().toUpperCase();
  
  // 1. Direct match
  if (priceMap[ertUpper]) return priceMap[ertUpper];
  
  // 2. Check aliases
  const aliases = productAliases[ertUpper] || [];
  for (const alias of aliases) {
    if (priceMap[alias]) return priceMap[alias];
  }
  
  // 3. Fallback partial match
  const keys = Object.keys(priceMap);
  const matchedKey = keys.find(k => k.includes(ertUpper) || ertUpper.includes(k));
  if (matchedKey) return priceMap[matchedKey];
  
  return null;
}

async function main() {
  console.log('Parsing PDF files...');
  const pdfPriceMaps = {};
  for (const [date, pdfName] of Object.entries(dateToPdfFile)) {
    if (!pdfPriceMaps[pdfName]) {
      pdfPriceMaps[pdfName] = await parsePdfFile(pdfName);
      console.log(`Parsed ${pdfName}: ${Object.keys(pdfPriceMaps[pdfName]).length} products`);
    }
  }
  
  console.log('\nFetching TÜTED Web Index for remaining dates...');
  const webIndex = await fetchTutedWebIndex();
  const webDates = Object.keys(webIndex).sort();
  const webPriceMaps = {};

  // Load Firebase data
  console.log('\nLoading Firebase transactions...');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) { console.error('Doc not found'); process.exit(1); }
  const fbData = docSnap.data();

  let updatedCount = 0;
  let pdfCount = 0;
  let webCount = 0;
  let fallbackCount = 0;
  const unmappedProducts = new Set();

  for (const tx of fbData.transactions) {
    if (tx.supplier !== 'ERTAŞLAR') continue;
    
    let tutedPrice = null;
    
    // Check if date uses PDF file
    const pdfName = dateToPdfFile[tx.date];
    if (pdfName && pdfPriceMaps[pdfName]) {
      tutedPrice = findMatchingPrice(tx.product, pdfPriceMaps[pdfName]);
      if (tutedPrice) pdfCount++;
    }
    
    // If not in PDF, check Web TÜTED
    if (!tutedPrice) {
      if (!webPriceMaps[tx.date]) {
        let entry = webIndex[tx.date];
        if (!entry) {
          const prior = webDates.filter(d => d <= tx.date).pop();
          if (prior) entry = webIndex[prior];
        }
        if (entry) {
          try {
            webPriceMaps[tx.date] = await fetchTutedWebExcel(entry.url);
          } catch (e) {
            webPriceMaps[tx.date] = {};
          }
        } else {
          webPriceMaps[tx.date] = {};
        }
      }
      
      tutedPrice = findMatchingPrice(tx.product, webPriceMaps[tx.date]);
      if (tutedPrice) webCount++;
    }
    
    if (tutedPrice) {
      tx.supplyPrice = Math.round(tutedPrice * MARGIN * 100) / 100;
      updatedCount++;
    } else {
      unmappedProducts.add(`${tx.date} | ${tx.product}`);
      fallbackCount++;
      // fallback to buyPrice * 1.82
      tx.supplyPrice = Math.round(tx.buyPrice * MARGIN * 100) / 100;
    }
  }

  console.log(`\n=== FINAL RECALCULATION SUMMARY ===`);
  console.log(`Total ERTAŞLAR transactions updated: ${updatedCount + fallbackCount}`);
  console.log(`Matched via PDF files: ${pdfCount}`);
  console.log(`Matched via Web TÜTED: ${webCount}`);
  console.log(`Fallback (buyPrice * 1.82): ${fallbackCount}`);
  
  if (unmappedProducts.size > 0) {
    console.log(`\nUnmapped items (${unmappedProducts.size}):`);
    [...unmappedProducts].slice(0, 15).forEach(p => console.log(`  ${p}`));
  }

  console.log('\nSaving updated data to Firebase...');
  await setDoc(docRef, fbData);
  console.log('✅ Firebase successfully updated!');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
