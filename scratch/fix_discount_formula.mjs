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

const dateToPdfFile = {
  '2026-04-30': '30.04.pdf',
  '2026-05-01': '01.05.pdf',
  '2026-05-06': '06.05.pdf',
  '2026-05-09': '09.05.pdf',
  '2026-05-12': '12.05.pdf',
  '2026-05-31': '30.05.pdf', // 31.05 (Pazar) -> 30.05 (Cumartesi)
  '2026-06-01': '01.06.pdf',
  '2026-06-11': '11.06.pdf',
  '2026-06-12': '12.06.pdf',
  '2026-06-13': '13.06.pdf',
  '2026-06-14': '13.06.pdf', // 14.06 (Pazar) -> 13.06 (Cumartesi)
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

// Parse PDF file (TÜTED prices in PDF are x10 -> divide by 10)
async function parsePdfFile(filename) {
  const filePath = path.join(pdfFolder, filename);
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const data = await parser.getText();
  
  const priceMap = {};
  const lines = data.text.split('\n');
  
  for (const line of lines) {
    const parts = line.split('\t').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const prodName = parts[0].toUpperCase();
      const priceStr = parts[parts.length - 1].replace(/\./g, '').replace(',', '.');
      const rawVal = parseFloat(priceStr);
      if (!isNaN(rawVal) && rawVal > 0) {
        priceMap[prodName] = rawVal / 10;
      }
    }
  }
  return priceMap;
}

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
  console.log('Parsing PDF files from Desktop/tüted...');
  const pdfPriceMaps = {};
  for (const [date, pdfName] of Object.entries(dateToPdfFile)) {
    if (!pdfPriceMaps[pdfName]) {
      pdfPriceMaps[pdfName] = await parsePdfFile(pdfName);
    }
  }
  
  console.log('Fetching TÜTED Web Index...');
  const webIndex = await fetchTutedWebIndex();
  const webDates = Object.keys(webIndex).sort();
  const webPriceMaps = {};

  console.log('Loading Firebase transactions...');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) process.exit(1);
  const fbData = docSnap.data();

  let updatedCount = 0;
  const samples = [];

  for (const tx of fbData.transactions) {
    if (tx.supplier !== 'ERTAŞLAR') continue;
    
    // Determine margin rate based on hotel
    const hUpper = (tx.hotel || '').toUpperCase().trim();
    const isSpecialHotel = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA');
    const marginRate = isSpecialHotel ? 0.22 : 0.18; // %82 indirim = 0.18, %78 indirim = 0.22
    
    let tutedPriceTL = null;
    
    const pdfName = dateToPdfFile[tx.date];
    if (pdfName && pdfPriceMaps[pdfName]) {
      tutedPriceTL = findMatchingPrice(tx.product, pdfPriceMaps[pdfName]);
    }
    
    if (tutedPriceTL === null) {
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
      tutedPriceTL = findMatchingPrice(tx.product, webPriceMaps[tx.date]);
    }
    
    const basePrice = (tutedPriceTL !== null && tutedPriceTL > 0) ? tutedPriceTL : tx.buyPrice;
    // Calculate Tedarik Fiyatı = TÜTED Fiyatı * 0.18 (OR 0.22)
    tx.supplyPrice = Math.round(basePrice * marginRate * 100) / 100;
    updatedCount++;

    if (samples.length < 8) {
      samples.push({
        date: tx.date,
        hotel: tx.hotel,
        product: tx.product,
        buyPrice: tx.buyPrice,
        tutedPrice: tutedPriceTL ? tutedPriceTL.toFixed(2) : '—',
        rate: marginRate === 0.18 ? '%82 İndirim (x0.18)' : '%78 İndirim (x0.22)',
        supplyPrice: tx.supplyPrice
      });
    }
  }

  console.log(`\n=== CORRECTED CALCULATION SUMMARY ===`);
  console.log(`Updated ${updatedCount} transactions with %82 DISCOUNT (TÜTED x 0.18) formula!`);
  console.log('\nSample corrected rows:');
  samples.forEach(s => {
    console.log(`  ${s.date} | ${s.hotel} | ${s.product} | Alış: ${s.buyPrice} TL | TÜTED: ${s.tutedPrice} TL | Formül: ${s.rate} -> Tedarik F.: ${s.supplyPrice} TL`);
  });

  console.log('\nSaving corrected data to Firebase...');
  await setDoc(docRef, fbData);
  console.log('✅ Firebase successfully updated with %82 discount formula!');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
