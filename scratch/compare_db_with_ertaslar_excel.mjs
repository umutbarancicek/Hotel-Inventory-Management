import fs from 'fs';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

const pathExcel = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";

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
  return String(val).trim();
}

async function compare() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const dbTxs = (data.transactions || []).filter(t => t.supplier === 'ERTAŞLAR');

  const buf = fs.readFileSync(pathExcel);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Sheet'];
  const excelRows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(1).filter(r => r[0] && r[1] && r[3] > 0 && r[8]);

  console.log(`DB Ertaşlar transactions count: ${dbTxs.length}`);
  console.log(`Excel Ertaşlar rows count: ${excelRows.length}`);

  // Create key maps
  const dbMap = new Map();
  dbTxs.forEach(t => {
    const key = `${t.date}___${t.hotel}___${t.product}___${t.qty}___${t.buyPrice}`;
    dbMap.set(key, t);
  });

  const excelMap = new Map();
  excelRows.forEach((r, idx) => {
    const d = parseDateToIso(r[0]);
    const p = cleanProductName(r[1]);
    const q = parseFloat(r[3]) || 0;
    const rawPrice = parseFloat(r[4]) || 0;
    const b = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
    const h = cleanHotelName(r[8]);
    
    const key = `${d}___${h}___${p}___${q}___${b}`;
    excelMap.set(key, { row: idx + 2, data: r });
  });

  // 1. Missing in DB
  let missingInDb = 0;
  excelMap.forEach((val, key) => {
    if (!dbMap.has(key)) {
      missingInDb++;
      if (missingInDb <= 10) {
        console.log(`[MISSING IN DB] Excel Row ${val.row}: Date: ${parseDateToIso(val.data[0])} | Hotel: ${cleanHotelName(val.data[8])} | Prod: ${cleanProductName(val.data[1])} | Qty: ${val.data[3]} | Price: ₺${val.data[4]}`);
      }
    }
  });

  // 2. Extra in DB
  let extraInDb = 0;
  dbMap.forEach((val, key) => {
    if (!excelMap.has(key)) {
      extraInDb++;
      if (extraInDb <= 10) {
        console.log(`[EXTRA IN DB] Date: ${val.date} | Hotel: ${val.hotel} | Prod: ${val.product} | Qty: ${val.qty} | Price: ₺${val.buyPrice}`);
      }
    }
  });

  console.log(`\nSummary:`);
  console.log(`- Missing in DB (in Excel but not DB): ${missingInDb}`);
  console.log(`- Extra in DB (in DB but not Excel): ${extraInDb}`);
}

compare().catch(console.error);
