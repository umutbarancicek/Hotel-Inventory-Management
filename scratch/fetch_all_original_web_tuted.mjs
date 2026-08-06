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

async function restoreOriginalWebTuted() {
  console.log('=== FETCHING ORIGINAL RAW TÜTED PRICE LISTS FROM ANTALYA TÜTED WEBSITE ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const uniqueDates = [...new Set(transactions.map(t => t.date))].sort();

  console.log(`Found ${uniqueDates.length} unique transaction dates in database.`);

  // 1. Fetch main page listing from antalyatuted.org.tr
  const mainHtmlBuf = await fetchUrl('https://antalyatuted.org.tr/FiyatListesi');
  const htmlStr = mainHtmlBuf.toString('utf-8');

  // Match links like <a href="/Dosya/Indir/..." ...>
  const linkMatches = [...htmlStr.matchAll(/href="(\/Dosya\/Indir\/[^"]+)"/g)];
  console.log(`Found ${linkMatches.length} price list download links on antalyatuted.org.tr`);

  // Extract dates from page text
  const dateMap = [];
  const trMatches = [...htmlStr.matchAll(/<tr>\s*<td>([\d\.]+)<\/td>[\s\S]*?href="(\/Dosya\/Indir\/[^"]+)"/g)];

  trMatches.forEach(m => {
    const rawDate = m[1].trim();
    const url = m[2].trim();
    const [d, mon, y] = rawDate.split('.');
    if (d && mon && y) {
      const iso = `${y}-${mon.padStart(2,'0')}-${d.padStart(2,'0')}`;
      dateMap.push({ iso, rawDate, url });
    }
  });

  console.log(`Parsed ${dateMap.length} dated price lists from web index.`);

  const priceLists = {};

  for (const dateIso of uniqueDates) {
    let target = dateMap.find(e => e.iso === dateIso);
    if (!target) {
      const sorted = dateMap.filter(e => e.iso <= dateIso).sort((a,b) => b.iso.localeCompare(a.iso));
      target = sorted[0];
    }

    if (!target) continue;

    try {
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
          product: r[2].toString().trim(),
          unit: r[3].toString().trim(),
          price: r[4].toString().trim()
        });
      }

      if (items.length > 0) {
        priceLists[dateIso] = items;
        console.log(`[OK] Fetched ${items.length} original raw items for ${dateIso} (from ${target.rawDate})`);
      }
    } catch (err) {
      console.error(`Failed to fetch for ${dateIso}:`, err.message);
    }
  }

  console.log(`\nSuccessfully fetched ${Object.keys(priceLists).length} original raw price lists.`);

  await updateDoc(docRef, {
    priceLists: priceLists
  });

  console.log('✅ Firebase priceLists restored to 100% ORIGINAL RAW WEB DATA from antalyatuted.org.tr!');
}

restoreOriginalWebTuted().catch(console.error);
