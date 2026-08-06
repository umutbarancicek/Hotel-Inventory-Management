import fs from 'fs';
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

const pathOtelYedek = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const pathErtaslar = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const pathMallar = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (2).xlsx";

function cleanStr(str) {
  return (str || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

function cleanHotelName(raw) {
  const u = cleanStr(raw);
  if (u.includes('GRAND')) return 'GRAND MİRAMOR';
  if (u.includes('SEAPHORIA') || u.includes('SEAPHORİA') || u.includes('SEPHORIA')) return 'SEAPHORİA';
  if (u.includes('CASAFORA')) return 'CASAFORA';
  if (u.includes('AMBASSADOR')) return 'AMBASSADOR';
  if (u.includes('GARDEN')) return 'MİRAMOR GARDEN';
  if (u.includes('STELLA')) return 'STELLA';
  if (u.includes('ASTORIA') || u.includes('ASTORİA')) return 'ASTORİA';
  return u.replace('ANA DEPO', '').trim();
}

function cleanProductName(raw) {
  const u = cleanStr(raw);
  if (u === 'DOMATES CAM' || u === 'DOMATES TARLA') return 'DOMATES';
  if (u === 'KABAK TAZE') return 'KABAK SAKIZ';
  if (u === 'LAHANA BEYAZ') return 'LAHANA';
  return u;
}

function parseDateToIso(val) {
  if (typeof val === 'number') {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  return str;
}

function parseCurrencyStr(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = String(str).replace(/[^\d\,\-]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

async function restoreDatabase() {
  console.log('=== RESTORING DATABASE WITH OCCURRENCE DEDUPLICATION ===');

  const masterMap = new Map();

  function makeKey(date, supplier, hotel, product, qty, buyPrice, keyCounts) {
    const baseKey = `${date}___${cleanStr(supplier)}___${cleanHotelName(hotel)}___${cleanProductName(product)}___${qty}___${buyPrice}`;
    const count = keyCounts.get(baseKey) || 0;
    keyCounts.set(baseKey, count + 1);
    return `${baseKey}___${count}`;
  }

  // 1. P1: otel yedek.xlsm
  console.log('Reading Otel Yedek (P1)...');
  const otelBuf = fs.readFileSync(pathOtelYedek);
  const otelWb = XLSX.read(otelBuf, { type: 'buffer' });
  const wsOtel = otelWb.Sheets['VERİ'];
  const otelRows = XLSX.utils.sheet_to_json(wsOtel, { header: 1, raw: true }).slice(2).filter(r => r[0] && r[1] && r[2] && r[3] > 0);

  const otelKeyCounts = new Map();
  let p1Count = 0;
  otelRows.forEach(r => {
    const d = parseDateToIso(r[1]);
    const s = cleanStr(r[0]);
    const p = cleanProductName(r[2]);
    const q = parseFloat(r[3]) || 0;
    const h = cleanHotelName(r[4]);
    const b = parseFloat(r[6]) || 0;
    const sp = parseFloat(r[7]) || 0;

    const k = makeKey(d, s, h, p, q, b, otelKeyCounts);
    if (!masterMap.has(k)) {
      masterMap.set(k, {
        id: 1785800000000 + masterMap.size,
        date: d, supplier: s, product: p, qty: q, hotel: h, buyPrice: b, supplyPrice: sp
      });
      p1Count++;
    }
  });

  // 2. P2: Ertaşlar
  console.log('Reading Ertaşlar (P2)...');
  const ertBuf = fs.readFileSync(pathErtaslar);
  const ertWb = XLSX.read(ertBuf, { type: 'buffer' });
  const wsErt = ertWb.Sheets['Sheet'];
  const ertRows = XLSX.utils.sheet_to_json(wsErt, { header: 1, raw: true }).slice(1).filter(r => r[0] && r[1] && r[3] > 0 && r[8]);

  const ertKeyCounts = new Map();
  let p2Count = 0;
  ertRows.forEach(r => {
    const d = parseDateToIso(r[0]);
    const p = cleanProductName(r[1]);
    const q = parseFloat(r[3]) || 0;
    const rawPrice = parseFloat(r[4]) || 0;
    const b = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
    const h = cleanHotelName(r[8]);
    const s = 'ERTAŞLAR';

    const marginRate = (h === 'SEAPHORİA' || h === 'CASAFORA') ? 0.22 : 0.18;
    const sp = Math.round(b * marginRate * 100) / 100;

    const k = makeKey(d, s, h, p, q, b, ertKeyCounts);
    if (!masterMap.has(k)) {
      masterMap.set(k, {
        id: 1785900000000 + masterMap.size,
        date: d, supplier: s, product: p, qty: q, hotel: h, buyPrice: b, supplyPrice: sp
      });
      p2Count++;
    }
  });

  // 3. P3: Mallar
  console.log('Reading Mallar (P3)...');
  const mallarBuf = fs.readFileSync(pathMallar);
  const mallarWb = XLSX.read(mallarBuf, { type: 'buffer' });
  const wsMallar = mallarWb.Sheets['Pivot Raporu'];
  const mallarRows = XLSX.utils.sheet_to_json(wsMallar, { header: 1, raw: false }).slice(1).filter(r => r[0] && r[1] && r[2] && r[3] && r[4] !== undefined);

  const mallarKeyCounts = new Map();
  let p3Count = 0;
  mallarRows.forEach(r => {
    const d = parseDateToIso(r[1]);
    const s = cleanStr(r[0]);
    const p = cleanProductName(r[2]);
    const h = cleanHotelName(r[3]);
    const q = parseFloat(String(r[4]).replace(/\./g, '').replace(',', '.')) || 0;
    const halTutar = parseCurrencyStr(r[5]);
    const tedarikTutar = parseCurrencyStr(r[6]);
    const b = q > 0 ? Math.round((halTutar / q) * 100) / 100 : 0;
    const sp = q > 0 ? Math.round((tedarikTutar / q) * 100) / 100 : b;

    if (q > 0) {
      const k = makeKey(d, s, h, p, q, b, mallarKeyCounts);
      if (!masterMap.has(k)) {
        masterMap.set(k, {
          id: 1785950000000 + masterMap.size,
          date: d, supplier: s, product: p, qty: q, hotel: h, buyPrice: b, supplyPrice: sp
        });
        p3Count++;
      }
    }
  });

  const finalCleanTxs = Array.from(masterMap.values());
  console.log(`\nImport Summary:`);
  console.log(`- Otel Yedek (P1): ${p1Count}`);
  console.log(`- Ertaşlar (P2): ${p2Count}`);
  console.log(`- Mallar (P3): ${p3Count}`);
  console.log(`- Total transactions: ${finalCleanTxs.length}`);

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const existingData = docSnap.data();

  existingData.transactions = finalCleanTxs;

  await updateDoc(docRef, {
    transactions: finalCleanTxs
  });

  console.log('✅ Firebase transactions successfully restored with occurrence de-duplication!');
}

restoreDatabase().catch(console.error);
