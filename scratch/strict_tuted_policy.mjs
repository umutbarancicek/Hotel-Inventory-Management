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

const pdfFolder = 'C:\\Users\\Baran\\Desktop\\tüted';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const dateToPdfFile = {
  '2026-04-30': '30.04.pdf',
  '2026-05-01': '01.05.pdf',
  '2026-05-06': '06.05.pdf',
  '2026-05-09': '09.05.pdf',
  '2026-05-12': '12.05.pdf',
  '2026-05-30': '30.05.pdf',
  '2026-05-31': '30.05.pdf', // 31.05 Pazar -> 30.05 Cumartesi
  '2026-06-01': '01.06.pdf',
  '2026-06-11': '11.06.pdf',
  '2026-06-12': '12.06.pdf',
  '2026-06-13': '13.06.pdf',
  '2026-06-14': '13.06.pdf', // 14.06 Pazar -> 13.06 Cumartesi
  '2026-06-27': '27.06.pdf',
};

const productAliases = {
  'ADAÇAYI TAZE': ['ADAÇAYI', 'ADAÇAYI TAZE'],
  'ARMUT': ['ARMUT SANDAMARİA', 'ARMUT'],
  'BİBER DOLMALIK YEŞİL': ['BİBER DOLMA', 'BİBER DOLMALIK YEŞİL'],
  'BİBER KALİFORNİYA': ['BİBER KALİFORNİYA'],
  'BİBER KAPYA': ['BİBER KAPYA'],
  'BİBER KIL SİVRİ': ['BİBER KIL SİVRİ', 'BİBER SİVRİ'],
  'BİBER SİVRİ': ['BİBER SİVRİ'],
  'BİBER ÇARLİSTON': ['BİBER ÇARLİSTON'],
  'BİBERİYE ROSEMARY PAKET': ['ROZMARİN', 'BİBERİYE'],
  'DEREOTU': ['DEREOTU'],
  'DOMATES BEEF': ['DOMATES BEEF'],
  'DOMATES CAM': ['DOMATES'],
  'DOMATES KOKTEYL': ['DOMATES KOKTEYL', 'DOMATES KOKTEL'],
  'DOMATES ÇERİ': ['DOMATES CHERRY', 'DOMATES CHERRY PAKET', 'DOMATES CHERY'],
  'ELMA GOLDEN': ['ELMA GOLDEN'],
  'ELMA GRANNY SMİTH': ['ELMA GRANSİMİT', 'ELMA GREEN', 'ELMA GRANNY SMİTH'],
  'ELMA KIRMIZI': ['ELMA STARKING', 'ELMA KIRMIZI'],
  'ERİK ANJELİKA': ['ERİK ANJELİKA', 'ERİK'],
  'FESLEĞEN': ['FESLEĞEN', 'FESLEĞEN PAKET'],
  'GREYFURT': ['GREYFURT'],
  'HAVUÇ': ['HAVUÇ BEYPAZARI', 'HAVUÇ'],
  'HAVUÇ MİNİ': ['HAVUÇ MİNİ'],
  'ISPANAK TAZE': ['ISPANAK'],
  'KABAK BAL': ['KABAK BAL DEKORLUK', 'KABAK BAL'],
  'KABAK DEKORLUK': ['KABAK BAL DEKORLUK', 'KABAK DEKORLUK'],
  'KABAK MİNİ': ['KABAK MİNİ', 'KABAK SAKIZ'],
  'KABAK SİYAH': ['KABAK SAKIZ'],
  'KABAK TAZE': ['KABAK SAKIZ', 'KABAK TAZE'],
  'KARNABAHAR': ['KARNABAHAR'],
  'KARPUZ': ['KARPUZ'],
  'KAYISI': ['KAYISI'],
  'KEKİK TAZE': ['KEKİK TAZE'],
  'KEREVİZ': ['KEREVİZ'],
  'KUZU KULAĞI': ['KUZU KULAĞI', 'KUZU KULAGI PAKET'],
  'KİRAZ': ['KİRAZ'],
  'LAHANA BEYAZ': ['LAHANA BEYAZ'],
  'LAHANA KIRMIZI': ['LAHANA KIRMIZI'],
  'LİMON': ['LİMON'],
  'MANDALİNA': ['MANDALİNA PAKET', 'MANDALİNA'],
  'MARUL AYSBERG': ['MARUL ICEBERG', 'MARUL AYSBERG', 'AYSBERG'],
  'MARUL DÜZ': ['MARUL DÜZ'],
  'MARUL KIRMIZI YAPRAK': ['KIRMIZI YAPRAK', 'MARUL KIRMIZI YAPRAK'],
  'MARUL KIVIRCIK': ['MARUL KIVIRCIK'],
  'MARUL LOLO ROSSO KIRMIZI': ['LOLOROSSO', 'MARUL LOLO ROSSO'],
  'MARUL POLOROSSO': ['POLOROSSO'],
  'MAYDANOZ': ['MAYDONOZ', 'MAYDANOZ'],
  'MAYDANOZ FRENK': ['MAYDONOZ FRENK', 'MAYDANOZ FRENK'],
  'MUZ YERLİ': ['MUZ YERLİ'],
  'NANE TAZE': ['NANE'],
  'NEKTARİN': ['NEKTARİN'],
  'PANCAR KIRMIZI': ['PANCAR KIRMIZI'],
  'PATATES': ['PATATES TAZE', 'PATATES'],
  'PATATES BABY': ['PATATES BABY'],
  'PATATES KUMPİR': ['PATATES KUMPİR'],
  'PATLICAN': ['PATLICAN'],
  'PATLICAN BOSTAN': ['PATLICAN BOSTAN'],
  'PAZI': ['PAZI YAPRAGI', 'PAZI'],
  'PIRASA': ['PIRASA'],
  'PORTAKAL MEYVELİK': ['PORTAKAL MEYVELİK PAKET', 'PORTAKAL MEYVELİK'],
  'PORTAKAL SIKMALIK': ['PORTAKAL SIKMALIK'],
  'ROKA': ['ROKA'],
  'SALATALIK': ['HIYAR YAYLA', 'SALATALIK'],
  'SALATALIK SLOR': ['SALATALIK SİLOR PAKET', 'SALATALIK SİLOR'],
  'SARIMSAK KURU': ['SARIMSAK KURU'],
  'SARIMSAK İTHAL': ['SARIMSAK İTHAL'],
  'SEMİZOTU': ['SEMİZOTU'],
  'SOĞAN FRENK': ['ŞİNİKLAV', 'SOĞAN FRENK'],
  'SOĞAN KIRMIZI': ['SOĞAN KIRMIZI'],
  'SOĞAN KURU': ['SOĞAN KURU'],
  'SOĞAN TAZE': ['SOĞAN TAZE'],
  'TERE': ['TERE'],
  'TERE SU': ['TERE SU'],
  'TURP': ['TURP KIRMIZI', 'TURP'],
  'TURP JAPON': ['TURP JAPON'],
  'YABAN MERSİNİ': ['BLUE BERRY', 'YABAN MERSİNİ'],
  'YENİ DÜNYA-MALTA ERİĞİ': ['YENİ DÜNYA', 'MALTA ERİĞİ'],
  'ÇİLEK': ['ÇİLEK'],
  'ŞEFTALİ': ['ŞEFTALİ'],
};

// Parse PDF file
async function parsePdfFile(filename, isoDate) {
  const filePath = path.join(pdfFolder, filename);
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();
  
  const priceMap = {};
  const priceListItems = [];
  const lines = data.text.split('\n');
  
  for (const line of lines) {
    const parts = line.split('\t').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const prodName = parts[0].toUpperCase();
      const unit = parts[1] || 'KG';
      const priceStr = parts[parts.length - 1].replace(/\./g, '').replace(',', '.');
      const val = parseFloat(priceStr);
      if (!isNaN(val) && val > 0) {
        priceMap[prodName] = val;
        priceListItems.push({
          date: isoDate,
          product: prodName,
          unit: unit,
          price: val.toFixed(2)
        });
      }
    }
  }
  return { priceMap, priceListItems };
}

async function fetchTutedWebIndex() {
  const res = await fetch('https://antalyatuted.org.tr/Fiyat/Index', { headers: HEADERS });
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

async function fetchTutedWebExcel(url, isoDate) {
  const res = await fetch('https://antalyatuted.org.tr' + url, { headers: HEADERS });
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  const priceMap = {};
  const priceListItems = [];
  
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[2] || !row[4]) continue;
    const name = row[2].toString().trim().toUpperCase();
    const unit = row[3] ? row[3].toString().trim() : 'Kg';
    const priceStr = row[4].toString().replace(/\./g, '').replace(',', '.').trim();
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price > 0) {
      priceMap[name] = price;
      priceListItems.push({
        date: isoDate,
        product: name,
        unit: unit,
        price: price.toFixed(2)
      });
    }
  }
  return { priceMap, priceListItems };
}

function findMatchingPrice(ertName, priceMap) {
  const ertUpper = ertName.trim().toUpperCase();
  if (priceMap[ertUpper] !== undefined) return priceMap[ertUpper];
  
  const aliases = productAliases[ertUpper] || [];
  for (const alias of aliases) {
    if (priceMap[alias] !== undefined) return priceMap[alias];
  }
  
  const keys = Object.keys(priceMap);
  const matchedKey = keys.find(k => k.includes(ertUpper) || ertUpper.includes(k));
  if (matchedKey && priceMap[matchedKey] !== undefined) return priceMap[matchedKey];
  
  return null;
}

async function main() {
  console.log('Loading Firebase appData...');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) process.exit(1);
  const fbData = docSnap.data();
  if (!fbData.priceLists) fbData.priceLists = {};

  const allPriceMaps = {};

  console.log('\n1. Parsing PDF files for April, May, June...');
  for (const [isoDate, pdfName] of Object.entries(dateToPdfFile)) {
    const { priceMap, priceListItems } = await parsePdfFile(pdfName, isoDate);
    allPriceMaps[isoDate] = priceMap;
    fbData.priceLists[isoDate] = priceListItems;
  }

  console.log('2. Fetching Web TÜTED for July dates...');
  const webIndex = await fetchTutedWebIndex();

  const ertaslarDates = [...new Set(fbData.transactions.filter(t => t.supplier === 'ERTAŞLAR').map(t => t.date))].sort();

  for (const isoDate of ertaslarDates) {
    if (allPriceMaps[isoDate]) continue;
    const entry = webIndex[isoDate];
    if (entry) {
      try {
        const { priceMap, priceListItems } = await fetchTutedWebExcel(entry.url, isoDate);
        allPriceMaps[isoDate] = priceMap;
        fbData.priceLists[isoDate] = priceListItems;
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        allPriceMaps[isoDate] = {};
      }
    } else {
      allPriceMaps[isoDate] = {};
    }
  }

  console.log('\n3. Processing ERTAŞLAR transactions (NO FALLBACK if TÜTED price is missing!)...');
  let matchedCount = 0;
  let emptyCount = 0;
  const emptyList = [];

  for (const tx of fbData.transactions) {
    if (tx.supplier !== 'ERTAŞLAR') continue;

    const hUpper = (tx.hotel || '').toUpperCase().trim();
    const isSpecialHotel = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA');
    const marginRate = isSpecialHotel ? 0.22 : 0.18;

    const priceMap = allPriceMaps[tx.date];
    let tutedPrice = null;

    if (priceMap) {
      tutedPrice = findMatchingPrice(tx.product, priceMap);
    }

    if (tutedPrice !== null && tutedPrice > 0) {
      tx.supplyPrice = Math.round(tutedPrice * marginRate * 100) / 100;
      matchedCount++;
    } else {
      // USER DIRECTIVE: If no TÜTED price exists for this date, DO NOT ENTER ANY FALLBACK PRICE! Leave supplyPrice = 0!
      tx.supplyPrice = 0;
      emptyCount++;
      emptyList.push(`${tx.date} | ${tx.hotel} | ${tx.product}`);
    }
  }

  console.log(`\n=== STRICT TÜTED CALCULATION SUMMARY ===`);
  console.log(`Total ERTAŞLAR transactions: ${matchedCount + emptyCount}`);
  console.log(`Exact TÜTED Matched: ${matchedCount}`);
  console.log(`NO TÜTED Price (Left Empty / 0): ${emptyCount}`);

  if (emptyList.length > 0) {
    console.log('\nTransactions left empty due to no TÜTED price:');
    emptyList.forEach(e => console.log(`  ${e}`));
  }

  console.log('\nSaving strict data to Firebase...');
  await setDoc(docRef, fbData);
  console.log('✅ Firebase successfully updated with strict no-fallback policy!');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
