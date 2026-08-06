import fs from 'fs';
import * as XLSX from 'xlsx';

const pathOtelYedek = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";

async function inspectOtelYedek() {
  const buf = fs.readFileSync(pathOtelYedek);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(2);

  const suppliers = new Set();
  const hotels = new Set();

  rows.forEach(r => {
    if (r[0]) suppliers.add(r[0]);
    if (r[4]) hotels.add(r[4]);
  });

  console.log('=== UNIQUE SUPPLIERS IN OTEL YEDEK ===');
  console.log(Array.from(suppliers));

  console.log('=== UNIQUE HOTELS IN OTEL YEDEK ===');
  console.log(Array.from(hotels));
}

inspectOtelYedek().catch(console.error);
