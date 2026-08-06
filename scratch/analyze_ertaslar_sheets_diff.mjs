import fs from 'fs';
import * as XLSX from 'xlsx';

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

async function analyze() {
  const buf = fs.readFileSync(pathExcel);
  const wb = XLSX.read(buf, { type: 'buffer' });

  // 1. Parse 'Sheet'
  const ws1 = wb.Sheets['Sheet'];
  const rows1 = XLSX.utils.sheet_to_json(ws1, { header: 1, raw: true }).slice(1).filter(r => r[0] && r[1] && r[3] > 0 && r[8]);
  
  const sheetMap = new Map();
  rows1.forEach((r, idx) => {
    const d = parseDateToIso(r[0]);
    const p = cleanProductName(r[1]);
    const q = parseFloat(r[3]) || 0;
    const rawPrice = parseFloat(r[4]) || 0;
    const b = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
    const h = cleanHotelName(r[8]);
    const key = `${d}___${h}___${p}___${q}___${b}`;
    sheetMap.set(key, { row: idx + 2, data: r });
  });

  // 2. Parse 'Sayfa1'
  const ws2 = wb.Sheets['Sayfa1'];
  const rows2 = XLSX.utils.sheet_to_json(ws2, { header: 1, raw: true }).slice(1).filter(r => r[0] && r[5] && r[7] > 0 && r[12]);
  
  console.log(`Sheet rows count: ${rows1.length}`);
  console.log(`Sayfa1 rows count: ${rows2.length}`);

  let missingInSheet = 0;
  rows2.forEach((r, idx) => {
    const d = parseDateToIso(r[0]);
    const p = cleanProductName(r[5]); // 'Sayfa1' column index 5 is product
    const q = parseFloat(r[7]) || 0;  // column 7 is qty
    const rawPrice = parseFloat(r[8]) || 0; // column 8 is price
    const b = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
    const h = cleanHotelName(r[12]); // column 12 is depot/hotel

    const key = `${d}___${h}___${p}___${q}___${b}`;
    if (!sheetMap.has(key)) {
      missingInSheet++;
      if (missingInSheet <= 10) {
        console.log(`Sayfa1 Row ${idx+2} NOT in Sheet: Date: ${d} | Hotel: ${h} | Prod: ${p} | Qty: ${q} | Price: ₺${b}`);
      }
    }
  });

  console.log(`\nTotal Sayfa1 rows missing in Sheet: ${missingInSheet} out of ${rows2.length}`);
}

analyze().catch(console.error);
