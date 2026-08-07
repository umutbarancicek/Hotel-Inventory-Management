import fs from 'fs';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

const PIVOT_FILE = "C:\\Users\\Baran\\Desktop\\pivot_sevk_raporu_2026-08-04 (2).xlsx";
const ERTASLAR_FILE = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const OTEL_YEDEK_FILE = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function excelSerialToISO_corrected(serial) {
  // Serial dates in this file have day/month SWAPPED
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  // Swap day and month
  return `${y}-${day}-${m}`;
}

function parseDate(val) {
  if (!val) return '';
  if (typeof val === 'number') return excelSerialToISO_corrected(val);
  const str = String(val).trim();
  if (/^\d{4,}\.\d+$/.test(str)) return excelSerialToISO_corrected(parseFloat(str));
  const parts = str.split('.');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return `${y}-${m}-${d}`;
  }
  return str;
}

function parseCurrency(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/[₺\s\.]/g, '').replace(',', '.')) || 0;
}

function cleanStr(s) {
  return (s || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

function cleanHotel(raw) {
  const u = cleanStr(raw);
  if (u.includes('GRAND') || u.includes('MİRAMOR') && !u.includes('GARDEN')) return 'GRAND MİRAMOR';
  if (u.includes('SEAPHORIA') || u.includes('SEAPHORİA') || u.includes('SEPHORIA')) return 'SEAPHORİA';
  if (u.includes('CASAFORA')) return 'CASAFORA';
  if (u.includes('AMBASSADOR')) return 'AMBASSADOR';
  if (u.includes('GARDEN')) return 'MİRAMOR GARDEN';
  if (u.includes('STELLA')) return 'STELLA';
  if (u.includes('ASTORIA') || u.includes('ASTORİA')) return 'ASTORİA';
  return u.replace('ANA DEPO', '').trim();
}

function cleanProduct(raw) {
  const u = cleanStr(raw);
  if (u === 'DOMATES CAM' || u === 'DOMATES TARLA') return 'DOMATES';
  if (u === 'KABAK TAZE') return 'KABAK SAKIZ';
  if (u === 'LAHANA BEYAZ') return 'LAHANA';
  return u;
}

// ─── STEP 1: PARSE PIVOT RAPORU ─────────────────────────────────────────────
// This file has ONE ROW per (supplier, date, product, hotel) combination.
// buyPrice = Toplam HAL TUTAR / Toplam KİLO
// supplyPrice = Toplam TEDARİK TUTAR / Toplam KİLO

function parsePivotRaporu() {
  const buf = fs.readFileSync(PIVOT_FILE);
  const wb = XLSX.read(buf, { type: 'buffer', raw: true });
  const ws = wb.Sheets['Pivot Raporu'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  
  const txs = [];
  let idBase = 1786000000000;
  
  rows.slice(1).forEach(r => {
    if (!r[0] || !r[1] || !r[2] || !r[3]) return;
    const supplier = cleanStr(r[0]);
    const date = parseDate(r[1]);
    const product = cleanProduct(r[2]);
    const hotel = cleanHotel(r[3]);
    const qty = parseFloat(r[4]) || 0;
    if (!date || qty <= 0) return;
    if (date === '') return;
    
    // Skip summary rows
    if (supplier.includes('GENEL TOPLAM') || product.includes('GENEL TOPLAM')) return;
    
    // Skip "MASRAF" and "KDV" entries - they are not transactions
    if (product === 'MASRAF' || product === 'KDV') return;
    
    const halTutar = parseCurrency(r[5]);
    const tedarikTutar = parseCurrency(r[6]);
    
    const buyPrice = qty > 0 ? Math.round((halTutar / qty) * 100) / 100 : 0;
    const supplyPrice = qty > 0 ? Math.round((tedarikTutar / qty) * 100) / 100 : 0;
    
    txs.push({
      id: idBase++,
      date,
      supplier,
      hotel,
      product,
      qty,
      buyPrice,
      supplyPrice
    });
  });
  
  return txs;
}

// ─── STEP 2: PARSE ERTAŞLAR EXCEL ───────────────────────────────────────────
// Ertaşlar has individual rows with individual weights and prices.
// Formula: supplyPrice = TÜTED × (0.22 if Seaphoria/Casafora else 0.18)
// NOTE: We will keep this separate and NOT average.

function parseErtaslarExcel() {
  const buf = fs.readFileSync(ERTASLAR_FILE);
  const wb = XLSX.read(buf, { type: 'buffer', raw: true });
  const ws = wb.Sheets['Sheet'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(1);
  
  const txs = [];
  let idBase = 1785900000000;
  
  rows.forEach(r => {
    if (!r[0] || !r[1] || !r[3] || parseFloat(r[3]) <= 0) return;
    if (!r[8]) return; // hotel is required
    
    const date = parseDate(r[0]);
    const product = cleanProduct(r[1]);
    const qty = parseFloat(r[3]) || 0;
    const rawPrice = parseFloat(r[4]) || 0;
    // Scale price if stored as kuruş (×100 values)
    const buyPrice = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
    const hotel = cleanHotel(r[8]);
    const supplier = 'ERTAŞLAR';
    
    if (!date || qty <= 0) return;
    
    // tuted column (if available in r[5] or r[6] range)
    // For Ertaşlar, supplyPrice = TÜTED * marginRate
    // We don't have TÜTED stored per row in this file, so we'll mark it 
    // to be recalculated from price lists. For now use buyPrice placeholder.
    // It will be corrected by the TÜTED recalculation pass.
    const isSpecial = hotel.includes('SEAPHORIA') || hotel.includes('SEAPHORİA') || hotel.includes('CASAFORA');
    const marginRate = isSpecial ? 0.22 : 0.18;
    // Placeholder — will be corrected with real TÜTED later
    const supplyPrice = Math.round(buyPrice * marginRate * 100) / 100;
    
    txs.push({
      id: idBase++,
      date,
      supplier,
      hotel,
      product,
      qty,
      buyPrice,
      supplyPrice
    });
  });
  
  return txs;
}

// ─── STEP 3: PARSE OTEL YEDEK ────────────────────────────────────────────────
// The master backup file with TÜTED values in col 5, buyPrice in col 6, supplyPrice in col 7.
// supplyPrice = TÜTED * marginRate  ← already calculated in the Excel

function parseOtelYedek() {
  const buf = fs.readFileSync(OTEL_YEDEK_FILE);
  const wb = XLSX.read(buf, { type: 'buffer', raw: true });
  const ws = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(2);
  
  const txs = [];
  let idBase = 1785800000000;
  
  rows.forEach(r => {
    if (!r[0] || !r[1] || !r[2] || !r[3] || parseFloat(r[3]) <= 0) return;
    
    const supplier = cleanStr(r[0]);
    const date = parseDate(r[1]);
    const product = cleanProduct(r[2]);
    const qty = parseFloat(r[3]) || 0;
    const hotel = cleanHotel(r[4]);
    const tuted = parseFloat(r[5]) || 0;
    const buyPrice = parseFloat(r[6]) || 0;
    const supplyPrice = parseFloat(r[7]) || 0;
    
    if (!date || qty <= 0) return;
    if (supplier === 'MÜSTAHSİL') return;
    
    txs.push({
      id: idBase++,
      date,
      supplier,
      hotel,
      product,
      qty,
      buyPrice,
      supplyPrice,
      tuted: tuted > 0 ? tuted : undefined
    });
  });
  
  return txs;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== PARSING SOURCE FILES ===');
  
  const pivotTxs = parsePivotRaporu();
  console.log(`Pivot Raporu: ${pivotTxs.length} transactions`);
  
  const ertaslarTxs = parseErtaslarExcel();
  console.log(`Ertaşlar Excel: ${ertaslarTxs.length} transactions`);
  
  const otelYedekTxs = parseOtelYedek();
  console.log(`Otel Yedek: ${otelYedekTxs.length} transactions`);
  
  // Show sample from pivot
  console.log('\nSample Pivot transactions:');
  pivotTxs.slice(0, 5).forEach(t => {
    console.log(`  ${t.date} | ${t.supplier} | ${t.product} -> ${t.hotel} | ${t.qty}kg | Buy:₺${t.buyPrice} | Supply:₺${t.supplyPrice}`);
  });
  
  // Show sample from Ertaslar
  console.log('\nSample Ertaşlar transactions:');
  ertaslarTxs.slice(0, 5).forEach(t => {
    console.log(`  ${t.date} | ${t.product} -> ${t.hotel} | ${t.qty}kg | Buy:₺${t.buyPrice} | Supply:₺${t.supplyPrice}`);
  });
  
  // Show sample from Otel Yedek
  console.log('\nSample Otel Yedek transactions:');
  otelYedekTxs.slice(0, 5).forEach(t => {
    console.log(`  ${t.date} | ${t.supplier} | ${t.product} -> ${t.hotel} | ${t.qty}kg | Tuted:${t.tuted} | Buy:₺${t.buyPrice} | Supply:₺${t.supplyPrice}`);
  });
  
  // Check unique dates from each source
  const pivotDates = [...new Set(pivotTxs.map(t => t.date))].sort();
  const ertDates = [...new Set(ertaslarTxs.map(t => t.date))].sort();
  const otelDates = [...new Set(otelYedekTxs.map(t => t.date))].sort();
  
  console.log('\n=== DATE SUMMARY ===');
  console.log(`Pivot: ${pivotDates.length} unique dates [${pivotDates[0]} to ${pivotDates[pivotDates.length-1]}]`);
  console.log(`Ertaşlar: ${ertDates.length} unique dates [${ertDates[0]} to ${ertDates[ertDates.length-1]}]`);
  console.log(`Otel Yedek: ${otelDates.length} unique dates [${otelDates[0]} to ${otelDates[otelDates.length-1]}]`);
  
  // Check Ertaşlar suppliers in pivot
  const pivotSuppliers = [...new Set(pivotTxs.map(t => t.supplier))];
  const ertaslarInPivot = pivotTxs.filter(t => t.supplier === 'ERTAŞLAR');
  console.log('\nPivot suppliers:', pivotSuppliers);
  console.log(`ERTAŞLAR rows in Pivot: ${ertaslarInPivot.length}`);
}

main().catch(console.error);
