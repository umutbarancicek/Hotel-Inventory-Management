import https from 'https';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

function fetchUrl(url, isExcel = false) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };
    if (isExcel) {
      headers['Referer'] = 'https://antalyatuted.org.tr/Fiyat/Index';
    }
    https.get(url, { headers }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function cleanStr(str) {
  return (str || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

function cleanProductName(raw) {
  const u = cleanStr(raw);
  if (u === 'DOMATES CAM' || u === 'DOMATES TARLA') return 'DOMATES';
  if (u === 'KABAK TAZE') return 'KABAK SAKIZ';
  if (u === 'LAHANA BEYAZ') return 'LAHANA';
  return u;
}

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

function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = String(str).replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

function findMatchingPrice(txProdName, priceMap) {
  const prodUpper = cleanProductName(txProdName);
  if (priceMap[prodUpper] !== undefined) return priceMap[prodUpper];
  
  const aliases = productAliases[prodUpper] || [];
  for (const alias of aliases) {
    if (priceMap[alias] !== undefined) return priceMap[alias];
  }
  
  const keys = Object.keys(priceMap);
  const matchedKey = keys.find(k => k.includes(prodUpper) || prodUpper.includes(k));
  if (matchedKey && priceMap[matchedKey] !== undefined) return priceMap[matchedKey];
  
  return null;
}

async function start() {
  console.log('=== MULTI-PAGE TÜTED SCRAPER & TOTAL RECALCULATION ===');

  const dateMap = {};

  // 1. Fetch index pages to cover all dates
  for (let page = 1; page <= 6; page++) {
    console.log(`Fetching page ${page}...`);
    const pageHtmlBuf = await fetchUrl(`https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${page}`, false);
    const htmlStr = pageHtmlBuf.toString('utf-8');

    const regex = /<td>\s*<a href="\/file\/pdf\/[^"]+" target="_blank">\s*(\d{2}\.\d{2}\.\d{4})[^<]*<\/a>\s*<\/td>\s*<td>\s*\d{2}\.\d{2}\.\d{4}\s*<\/td>\s*<td>\s*<a href="([^"]+)">Excel'e İndir<\/a>/g;
    let match;
    let pageMatchCount = 0;
    while ((match = regex.exec(htmlStr)) !== null) {
      const rawDate = match[1].trim();
      const url = match[2].trim();
      const [d, m, y] = rawDate.split('.');
      const iso = `${y}-${m}-${d}`;
      dateMap[iso] = { rawDate, url };
      pageMatchCount++;
    }
    console.log(`Page ${page}: Parsed ${pageMatchCount} price list links.`);
  }

  const scrapedDates = Object.keys(dateMap).sort();
  console.log(`\nScraped ${scrapedDates.length} unique dates from web index.`);

  // Load current DB data
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const uniqueTxDates = [...new Set(transactions.map(t => t.date))].sort();
  console.log(`Found ${uniqueTxDates.length} unique transaction dates in database.`);

  const priceLists = data.priceLists || {};

  // 2. Fetch missing price lists using CORRECT REFERER HEADERS
  let successCount = 0;
  for (const dateIso of uniqueTxDates) {
    if (priceLists[dateIso] && priceLists[dateIso].length > 0) {
      continue;
    }

    let target = dateMap[dateIso];
    if (!target) {
      const priorDates = scrapedDates.filter(d => d <= dateIso);
      if (priorDates.length > 0) {
        const priorDate = priorDates[priorDates.length - 1];
        target = dateMap[priorDate];
        console.log(`Date ${dateIso} not in index, using closest prior date: ${priorDate}`);
      }
    }

    if (!target) {
      console.log(`❌ No index entry found for ${dateIso}`);
      continue;
    }

    try {
      console.log(`Fetching Excel for ${dateIso} using link: ${target.url}...`);
      const excelBuf = await fetchUrl('https://antalyatuted.org.tr' + target.url, true);
      const wb = XLSX.read(excelBuf, { type: 'buffer' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const items = [];
      for (let i = 2; i < sheetData.length; i++) {
        const r = sheetData[i];
        if (!r || !r[2] || !r[3] || !r[4]) continue;
        items.push({
          date: dateIso,
          product: r[2].toString().trim().toUpperCase(),
          unit: r[3].toString().trim(),
          price: r[4].toString().trim()
        });
      }

      if (items.length > 0) {
        priceLists[dateIso] = items;
        successCount++;
        console.log(`[OK] Fetched ${items.length} items for ${dateIso}`);
      } else {
        console.log(`⚠️ Empty items for ${dateIso}`);
      }
    } catch (err) {
      console.error(`Failed for ${dateIso}:`, err.message);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  // 3. Recalculate ALL transactions' supplyPrice based on TÜTED borsa prices
  console.log('\n=== RECALCULATING ALL TRANSACTIONS SUPPLY PRICES ===');
  let updatedCount = 0;
  let missingTutedCount = 0;

  transactions.forEach(tx => {
    const list = priceLists[tx.date] || [];
    if (list.length === 0) {
      missingTutedCount++;
      return;
    }

    const priceMap = {};
    list.forEach(p => {
      priceMap[cleanProductName(p.product)] = parsePrice(p.price);
    });

    let tutedPrice = findMatchingPrice(tx.product, priceMap);
    if (tutedPrice === null || tutedPrice <= 0) {
      missingTutedCount++;
      return;
    }

    // Scale prices if raw borsa value is unscaled (e.g. 3.20) and supplyPrice is scaled (e.g. > 20)
    if (tutedPrice > 0 && tutedPrice < 10 && tx.supplyPrice > 20) {
      tutedPrice = tutedPrice * 100;
    }

    const hUpper = cleanStr(tx.hotel);
    const isSpecialHotel = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORIA') || hUpper.includes('CASAFORA');
    const marginRate = isSpecialHotel ? 0.22 : 0.18;

    const expectedSupplyPrice = Math.round(tutedPrice * marginRate * 100) / 100;
    const oldVal = tx.supplyPrice;

    if (oldVal !== expectedSupplyPrice) {
      tx.supplyPrice = expectedSupplyPrice;
      updatedCount++;
      if (updatedCount <= 50) {
        console.log(`[CORRECTED] Date: ${tx.date} | Hotel: ${tx.hotel} | Product: ${tx.product} | Buy: ₺${tx.buyPrice} | Tuted: ${tutedPrice} | Old Supply: ₺${oldVal} | New Supply: ₺${expectedSupplyPrice}`);
      }
    }
  });

  console.log(`\nRecalculation summary:`);
  console.log(`- Updated transactions count: ${updatedCount}`);
  console.log(`- Transactions with missing/unmatched TÜTED price: ${missingTutedCount}`);

  // Save to DB
  data.priceLists = priceLists;
  data.transactions = transactions;

  await updateDoc(docRef, {
    priceLists: priceLists,
    transactions: transactions
  });

  console.log('\n✅ Database successfully updated and all supply prices recalculated!');
}

start().catch(console.error);
