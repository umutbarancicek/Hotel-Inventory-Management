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

async function checkDuplicates() {
  const buf = fs.readFileSync(pathExcel);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Sheet'];
  const excelRows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(1).filter(r => r[0] && r[1] && r[3] > 0 && r[8]);

  const seen = new Map();
  let duplicatesCount = 0;

  excelRows.forEach((r, idx) => {
    const d = parseDateToIso(r[0]);
    const p = cleanProductName(r[1]);
    const q = parseFloat(r[3]) || 0;
    const rawPrice = parseFloat(r[4]) || 0;
    const b = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
    const h = cleanHotelName(r[8]);
    
    const key = `${d}___${h}___${p}___${q}___${b}`;
    if (seen.has(key)) {
      duplicatesCount++;
      if (duplicatesCount <= 10) {
        console.log(`Duplicate found: Row ${idx+2} matches Row ${seen.get(key)}: Key: ${key}`);
      }
    } else {
      seen.set(key, idx + 2);
    }
  });

  console.log(`\nTotal duplicate rows in Ertaşlar excel: ${duplicatesCount} out of ${excelRows.length}`);
}

checkDuplicates().catch(console.error);
