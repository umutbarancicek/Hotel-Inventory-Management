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
    if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  }
  return str;
}

function parseCurrencyStr(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = String(str).replace(/[^\d\,\-]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

async function auditPriorityMergedDatabase() {
  // 1. Load Otel Yedek (Priority 1)
  const otelBuf = fs.readFileSync(pathOtelYedek);
  const otelWb = XLSX.read(otelBuf, { type: 'buffer' });
  const wsOtel = otelWb.Sheets['VERİ'];
  const otelRows = XLSX.utils.sheet_to_json(wsOtel, { header: 1, raw: true }).slice(2).filter(r => r[0] && r[1] && r[2] && r[3] > 0);

  const priorityMap = new Map(); // key -> tx

  function makeKey(date, supplier, hotel, product, qty, buyPrice) {
    return `${date}___${cleanStr(supplier)}___${cleanHotelName(hotel)}___${cleanProductName(product)}___${qty}___${buyPrice}`;
  }

  let p1Added = 0;
  otelRows.forEach(r => {
    const d = parseExcelDate(r[1]);
    const s = cleanStr(r[0]);
    const p = cleanProductName(r[2]);
    const q = parseFloat(r[3]) || 0;
    const h = cleanHotelName(r[4]);
    const b = parseFloat(r[6]) || 0;
    const sp = parseFloat(r[7]) || 0;

    const k = makeKey(d, s, h, p, q, b);
    if (!priorityMap.has(k)) {
      priorityMap.set(k, { date: d, supplier: s, product: p, qty: q, hotel: h, buyPrice: b, supplyPrice: sp, priority: 1, source: 'otel yedek.xlsm' });
      p1Added++;
    }
  });

  // 2. Load Ertaşlar (Priority 2)
  const ertBuf = fs.readFileSync(pathErtaslar);
  const ertWb = XLSX.read(ertBuf, { type: 'buffer' });
  const wsErt = ertWb.Sheets['Sheet'];
  const ertRows = XLSX.utils.sheet_to_json(wsErt, { header: 1, raw: true }).slice(1).filter(r => r[0] && r[1] && r[3] > 0 && r[8]);

  let p2Added = 0;
  let p2SkippedDup = 0;
  ertRows.forEach(r => {
    const d = parseExcelDate(r[0]);
    const p = cleanProductName(r[1]);
    const q = parseFloat(r[3]) || 0;
    const rawPrice = parseFloat(r[4]) || 0;
    const b = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
    const h = cleanHotelName(r[8]);
    const s = 'ERTAŞLAR';

    const marginRate = (h === 'SEAPHORİA' || h === 'CASAFORA') ? 0.22 : 0.18;
    const sp = Math.round(b * marginRate * 100) / 100;

    const k = makeKey(d, s, h, p, q, b);
    if (!priorityMap.has(k)) {
      priorityMap.set(k, { date: d, supplier: s, product: p, qty: q, hotel: h, buyPrice: b, supplyPrice: sp, priority: 2, source: 'Ertaşlar (1).xlsx' });
      p2Added++;
    } else {
      p2SkippedDup++;
    }
  });

  // 3. Load Mallar PDF Excel (Priority 3)
  const mallarBuf = fs.readFileSync(pathMallar);
  const mallarWb = XLSX.read(mallarBuf, { type: 'buffer' });
  const wsMallar = mallarWb.Sheets['Pivot Raporu'];
  const mallarRows = XLSX.utils.sheet_to_json(wsMallar, { header: 1, raw: false }).slice(1).filter(r => r[0] && r[1] && r[2] && r[3] && r[4] !== undefined);

  let p3Added = 0;
  let p3SkippedDup = 0;
  mallarRows.forEach(r => {
    const d = parseExcelDate(r[1]);
    const s = cleanStr(r[0]);
    const p = cleanProductName(r[2]);
    const h = cleanHotelName(r[3]);
    const q = parseFloat(String(r[4]).replace(/\./g, '').replace(',', '.')) || 0;
    const halTutar = parseCurrencyStr(r[5]);
    const tedarikTutar = parseCurrencyStr(r[6]);
    const b = q > 0 ? Math.round((halTutar / q) * 100) / 100 : 0;
    const sp = q > 0 ? Math.round((tedarikTutar / q) * 100) / 100 : b;

    if (q > 0) {
      const k = makeKey(d, s, h, p, q, b);
      if (!priorityMap.has(k)) {
        priorityMap.set(k, { date: d, supplier: s, product: p, qty: q, hotel: h, buyPrice: b, supplyPrice: sp, priority: 3, source: 'mallar.pdf Excel' });
        p3Added++;
      } else {
        p3SkippedDup++;
      }
    }
  });

  const finalMergedList = Array.from(priorityMap.values());

  console.log('=== PRIORITY MERGE AUDIT SUMMARY ===');
  console.log(`- Priority 1 (otel yedek.xlsm) Net Valid Rows Added: ${p1Added}`);
  console.log(`- Priority 2 (Ertaşlar (1).xlsx) Net Unique Rows Added: ${p2Added} (Duplicates skipped: ${p2SkippedDup})`);
  console.log(`- Priority 3 (mallar.pdf Excel) Net Unique Rows Added: ${p3Added} (Duplicates skipped: ${p3SkippedDup})`);
  console.log(`\n✅ NET DE-DUPLICATED TOTAL TRANSACTIONS: ${finalMergedList.length}`);

  let totalKg = 0, totalHal = 0, totalTed = 0;
  finalMergedList.forEach(t => {
    totalKg += t.qty;
    totalHal += t.qty * t.buyPrice;
    totalTed += t.qty * t.supplyPrice;
  });

  console.log(`\n=== PRIORITY MERGED SYSTEM TOTALS ===`);
  console.log(`Total Kg: ${totalKg.toLocaleString('tr-TR')} kg`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
}

auditPriorityMergedDatabase().catch(console.error);
