import fs from 'fs';
import * as XLSX from 'xlsx';

const pathOtelYedek = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const pathErtaslar = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
const pathMallar = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (2).xlsx";

function cleanStr(str) {
  return (str || '').toString().trim().toUpperCase()
    .replace(/İ/g, 'I').replace(/I/g, 'I')
    .replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S').replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C').replace(/\s+/g, ' ');
}

function cleanHotelName(raw) {
  const u = cleanStr(raw);
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
  const u = cleanStr(raw);
  if (u === 'DOMATES CAM' || u === 'DOMATES TARLA') return 'DOMATES';
  if (u === 'KABAK TAZE') return 'KABAK SAKIZ';
  if (u === 'LAHANA BEYAZ') return 'LAHANA';
  return u;
}

function parseExcelDate(val) {
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
      return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
    }
  }
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      let p0 = parseInt(parts[0]);
      let p1 = parseInt(parts[1]);
      let y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      let d, m;
      if (p0 > 12) { d = String(p0).padStart(2, '0'); m = String(p1).padStart(2, '0'); }
      else { d = String(p1).padStart(2, '0'); m = String(p0).padStart(2, '0'); }
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

async function auditThreeFilesPriority() {
  console.log('=== THREE-FILE READ-ONLY AUDIT & CROSS-VALIDATION ===\n');

  // 1. Load Otel Yedek (Priority 1)
  const otelYedekBuf = fs.readFileSync(pathOtelYedek);
  const otelYedekWb = XLSX.read(otelYedekBuf, { type: 'buffer' });
  const wsOtel = otelYedekWb.Sheets['VERİ'];
  const otelRows = XLSX.utils.sheet_to_json(wsOtel, { header: 1, raw: true }).slice(2).filter(r => r[0] && r[1] && r[2] && r[3] > 0);

  const listOtelYedek = [];
  otelRows.forEach((r, idx) => {
    listOtelYedek.push({
      file: 'otel yedek.xlsm',
      priority: 1,
      rowIdx: idx + 3,
      date: parseExcelDate(r[1]),
      supplier: cleanStr(r[0]),
      product: cleanProductName(r[2]),
      qty: parseFloat(r[3]) || 0,
      hotel: cleanHotelName(r[4]),
      buyPrice: parseFloat(r[6]) || 0,
      supplyPrice: parseFloat(r[7]) || 0
    });
  });

  // 2. Load Ertaşlar (Priority 2)
  const ertBuf = fs.readFileSync(pathErtaslar);
  const ertWb = XLSX.read(ertBuf, { type: 'buffer' });
  const wsErt = ertWb.Sheets['Sheet'];
  const ertRows = XLSX.utils.sheet_to_json(wsErt, { header: 1, raw: true }).slice(1).filter(r => r[0] && r[1] && r[3] > 0 && r[8]);

  const listErtaslar = [];
  ertRows.forEach((r, idx) => {
    const buyPriceRaw = parseFloat(r[4]) || 0;
    const buyPriceTL = buyPriceRaw > 1000 ? buyPriceRaw / 100 : buyPriceRaw;
    const hotel = cleanHotelName(r[8]);
    const marginRate = (hotel === 'SEAPHORİA' || hotel === 'CASAFORA') ? 0.22 : 0.18;

    listErtaslar.push({
      file: 'Ertaşlar (1).xlsx',
      priority: 2,
      rowIdx: idx + 2,
      date: parseExcelDate(r[0]),
      supplier: 'ERTAŞLAR',
      product: cleanProductName(r[1]),
      qty: parseFloat(r[3]) || 0,
      hotel: hotel,
      buyPrice: buyPriceTL,
      supplyPrice: Math.round(buyPriceTL * marginRate * 100) / 100
    });
  });

  // 3. Load Mallar PDF Excel (Priority 3)
  const mallarBuf = fs.readFileSync(pathMallar);
  const mallarWb = XLSX.read(mallarBuf, { type: 'buffer' });
  const wsMallar = mallarWb.Sheets['Pivot Raporu'];
  const mallarRows = XLSX.utils.sheet_to_json(wsMallar, { header: 1, raw: false }).slice(1).filter(r => r[0] && r[1] && r[2] && r[3] && r[4] !== undefined);

  const listMallar = [];
  mallarRows.forEach((r, idx) => {
    const qty = parseFloat(String(r[4]).replace(/\./g, '').replace(',', '.')) || 0;
    const halTutar = parseCurrencyStr(r[5]);
    const tedarikTutar = parseCurrencyStr(r[6]);
    const buyPrice = qty > 0 ? Math.round((halTutar / qty) * 100) / 100 : 0;
    const supplyPrice = qty > 0 ? Math.round((tedarikTutar / qty) * 100) / 100 : buyPrice;

    if (qty > 0) {
      listMallar.push({
        file: 'mallar.pdf Excel',
        priority: 3,
        rowIdx: idx + 2,
        date: parseExcelDate(r[1]),
        supplier: cleanStr(r[0]),
        product: cleanProductName(r[2]),
        qty: qty,
        hotel: cleanHotelName(r[3]),
        buyPrice: buyPrice,
        supplyPrice: supplyPrice
      });
    }
  });

  console.log(`1. otel yedek.xlsm (Priority 1): ${listOtelYedek.length} rows`);
  console.log(`2. Ertaşlar (1).xlsx (Priority 2): ${listErtaslar.length} rows`);
  console.log(`3. mallar.pdf Excel (Priority 3): ${listMallar.length} rows`);

  // Detect exact matches & overlaps between files
  const keyMap = new Map();

  function makeKey(t) {
    return `${t.date}___${t.hotel}___${t.product}___${t.qty}`;
  }

  listOtelYedek.forEach(t => {
    const k = makeKey(t);
    if (!keyMap.has(k)) keyMap.set(k, []);
    keyMap.get(k).push(t);
  });

  let ertOverlapsOtel = 0;
  listErtaslar.forEach(t => {
    const k = makeKey(t);
    if (keyMap.has(k)) ertOverlapsOtel++;
  });

  let mallarOverlapsOtel = 0;
  listMallar.forEach(t => {
    const k = makeKey(t);
    if (keyMap.has(k)) mallarOverlapsOtel++;
  });

  console.log(`\n--- OVERLAP & DUPLICATION ANALYSIS ---`);
  console.log(`- Ertaşlar rows that ALREADY exist in otel yedek.xlsm: ${ertOverlapsOtel} rows`);
  console.log(`- mallar.pdf rows that ALREADY exist in otel yedek.xlsm: ${mallarOverlapsOtel} rows`);

  // Check internal duplicates within each file
  function countInternalDuplicates(list, name) {
    const counts = {};
    let dupCount = 0;
    list.forEach(t => {
      const k = `${t.date}___${t.supplier}___${t.hotel}___${t.product}___${t.qty}___${t.buyPrice}`;
      counts[k] = (counts[k] || 0) + 1;
    });
    Object.values(counts).forEach(c => { if (c > 1) dupCount += (c - 1); });
    console.log(`- Internal duplicate rows inside "${name}": ${dupCount} rows`);
  }

  console.log('\n--- INTERNAL DUPLICATE CHECKS ---');
  countInternalDuplicates(listOtelYedek, 'otel yedek.xlsm');
  countInternalDuplicates(listErtaslar, 'Ertaşlar (1).xlsx');
  countInternalDuplicates(listMallar, 'mallar.pdf Excel');
}

auditThreeFilesPriority().catch(console.error);
