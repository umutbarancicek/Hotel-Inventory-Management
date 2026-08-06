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

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function fetchAllTutedMultiPage() {
  console.log('=== MULTI-PAGE TÜTED SCRAPER ===');

  const dateMap = {};

  // Fetch first 5 pages to cover April - August 2026
  for (let page = 1; page <= 6; page++) {
    console.log(`Fetching page ${page}...`);
    const pageHtmlBuf = await fetchUrl(`https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${page}`);
    const htmlStr = pageHtmlBuf.toString('utf-8');

    // Regex to match date and excel link
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
  console.log(`\nScraped a total of ${scrapedDates.length} unique dates from web index.`);
  console.log('Date range in index:', scrapedDates[0], 'to', scrapedDates[scrapedDates.length - 1]);

  // Load current DB data
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const uniqueTxDates = [...new Set(transactions.map(t => t.date))].sort();
  console.log(`Found ${uniqueTxDates.length} unique transaction dates in database.`);

  const priceLists = data.priceLists || {};

  // Fetch missing price lists
  let successCount = 0;
  for (const dateIso of uniqueTxDates) {
    // If we already have a populated price list for this date, skip it
    if (priceLists[dateIso] && priceLists[dateIso].length > 0) {
      continue;
    }

    // Find exact match or closest prior date
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
      const excelBuf = await fetchUrl('https://antalyatuted.org.tr' + target.url);
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
      }
    } catch (err) {
      console.error(`Failed for ${dateIso}:`, err.message);
    }

    // Add a tiny delay to be nice to the server
    await new Promise(r => setTimeout(r, 200));
  }

  // Also parse manual files in C:\Users\Baran\Desktop\tüted if they exist and are needed
  // Note: we can parse pdf or check if they are already covered.
  // Actually, let's check if the index dates cover those 6 days!
  // Yes! The 6 dates ('28.04', '18.05', '23.05', '24.05', '03.06', '03.07') should be covered by index dates or manual PDFs.
  // Let's first save the fetched priceLists to the DB.
  data.priceLists = priceLists;
  await updateDoc(docRef, {
    priceLists: priceLists
  });

  console.log(`\n✅ Scraped & updated ${successCount} missing dates' price lists!`);
  const finalDates = Object.keys(priceLists).sort();
  console.log(`Total dates now in priceLists: ${finalDates.length}`);
}

fetchAllTutedMultiPage().catch(console.error);
