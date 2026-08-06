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

function parseReportDate(val) {
  if (typeof val === 'number') {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  if (str.includes('.')) {
    const [d, m, y] = str.split('.');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return str;
}

function parseCurrencyStr(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = String(str).replace(/[^\d\,\-]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

function cleanHotelName(raw) {
  const u = String(raw||'').trim().toUpperCase();
  if (u.includes('GRAND')) return 'GRAND MİRAMOR';
  if (u.includes('SEAPHORIA') || u.includes('SEPHORIA')) return 'SEAPHORİA';
  if (u.includes('CASAFORA')) return 'CASAFORA';
  if (u.includes('AMBASSADOR')) return 'AMBASSADOR';
  if (u.includes('GARDEN')) return 'MİRAMOR GARDEN';
  if (u.includes('STELLA')) return 'STELLA';
  if (u.includes('ASTORIA')) return 'ASTORİA';
  return u.replace('ANA DEPO', '').trim();
}

function cleanProductName(raw) {
  const u = String(raw||'').trim().toUpperCase();
  if (u === 'DOMATES CAM' || u === 'DOMATES TARLA') return 'DOMATES';
  if (u === 'KABAK TAZE') return 'KABAK SAKIZ';
  if (u === 'LAHANA BEYAZ') return 'LAHANA';
  return u;
}

async function revertErtaslarMsd07Separation() {
  console.log('=== SEPARATING MSD07 TAR ÜR AND ERTAŞLAR INTO TWO DISTINCT SUPPLIERS ===');

  // 1. Load mallar.pdf Excel data (pivot_sevk_raporu)
  const mallarPath = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (2).xlsx";
  const mallarBuf = fs.readFileSync(mallarPath);
  const mallarWb = XLSX.read(mallarBuf, { type: 'buffer' });
  const mallarWs = mallarWb.Sheets['Pivot Raporu'];
  const mallarRows = XLSX.utils.sheet_to_json(mallarWs, { header: 1, raw: false });

  const mallarTxs = [];
  mallarRows.slice(1).filter(r => r[0] && r[1] && r[2] && r[3] && r[4] !== undefined).forEach((r, idx) => {
    const supplier = String(r[0]).trim(); // e.g. "MSD07 TAR ÜR", "ANTALYA HAL", "KUMLUCA HAL"
    const isoDate = parseReportDate(r[1]);
    const prod = String(r[2]).trim();
    const hotel = String(r[3]).trim();
    const qty = parseFloat(String(r[4]).replace(/\./g, '').replace(',', '.')) || 0;
    const halTutar = parseCurrencyStr(r[5]);
    const tedarikTutar = parseCurrencyStr(r[6]);

    const buyPrice = qty > 0 ? Math.round((halTutar / qty) * 100) / 100 : 0;
    const supplyPrice = qty > 0 ? Math.round((tedarikTutar / qty) * 100) / 100 : buyPrice;

    if (qty > 0) {
      mallarTxs.push({
        id: 1785800000000 + idx,
        date: isoDate,
        supplier: supplier, // Preserves exact "MSD07 TAR ÜR", "ANTALYA HAL", "KUMLUCA HAL" etc.
        hotel: hotel,
        product: prod,
        qty: qty,
        buyPrice: buyPrice,
        supplyPrice: supplyPrice
      });
    }
  });

  console.log(`Loaded ${mallarTxs.length} transactions from mallar.pdf.`);

  // 2. Load Ertaşlar Excel data (Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx)
  const ertPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
  const ertBuf = fs.readFileSync(ertPath);
  const ertWb = XLSX.read(ertBuf, { type: 'buffer' });
  const ertWs = ertWb.Sheets['Sheet'];
  const ertRows = XLSX.utils.sheet_to_json(ertWs, { header: 1, raw: true });

  const ertTxs = [];
  ertRows.slice(1).filter(r => r[0] && r[1] && r[3] > 0 && r[8]).forEach((r, idx) => {
    const isoDate = parseReportDate(r[0]);
    const prod = cleanProductName(r[1]);
    const qty = parseFloat(r[3]) || 0;
    const buyPrice = parseFloat(r[4]) || 0;
    const hotel = cleanHotelName(r[8]);
    const supplier = 'ERTAŞLAR'; // Distinct separate supplier "ERTAŞLAR"!

    const marginRate = (hotel === 'SEAPHORİA' || hotel === 'CASAFORA') ? 0.22 : 0.18;
    const supplyPrice = Math.round(buyPrice * marginRate * 100) / 100;

    if (qty > 0) {
      ertTxs.push({
        id: 1785998000000 + idx,
        date: isoDate,
        supplier: supplier,
        product: prod,
        hotel: hotel,
        qty: qty,
        buyPrice: buyPrice,
        supplyPrice: supplyPrice
      });
    }
  });

  console.log(`Loaded ${ertTxs.length} distinct transactions for ERTAŞLAR.`);

  const allCombinedTxs = [...mallarTxs, ...ertTxs];
  console.log(`Total Combined Transactions Count: ${allCombinedTxs.length}`);

  const msdCount = allCombinedTxs.filter(t => t.supplier === 'MSD07 TAR ÜR').length;
  const ertCount = allCombinedTxs.filter(t => t.supplier === 'ERTAŞLAR').length;
  console.log(`MSD07 TAR ÜR Transactions: ${msdCount}`);
  console.log(`ERTAŞLAR Transactions: ${ertCount}`);

  const docRef = doc(db, 'storage', 'appData');
  await updateDoc(docRef, {
    transactions: allCombinedTxs
  });

  console.log('✅ MSD07 TAR ÜR and ERTAŞLAR successfully separated into two distinct suppliers!');
}

revertErtaslarMsd07Separation().catch(console.error);
