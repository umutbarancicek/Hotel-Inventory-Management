import fs from 'fs';
import * as XLSX from 'xlsx';

const pathOtelYedek = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";

async function checkOtelYedek() {
  const buf = fs.readFileSync(pathOtelYedek);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(2).filter(r => r[0] && r[1] && r[2] && r[3] > 0);

  let lowerCount = 0;
  let totalCount = rows.length;

  console.log(`Total rows in Otel Yedek: ${totalCount}`);
  rows.forEach((r, idx) => {
    const buy = parseFloat(r[6]) || 0;
    const supply = parseFloat(r[7]) || 0;
    if (supply < buy && supply > 0) {
      lowerCount++;
      if (lowerCount <= 10) {
        console.log(`Row ${idx+3}: Supplier: ${r[0]} | Hotel: ${r[4]} | Product: ${r[2]} | Buy: ₺${buy} | Supply: ₺${supply}`);
      }
    }
  });

  console.log(`\nRows where supply < buy: ${lowerCount} out of ${totalCount}`);
}

checkOtelYedek().catch(console.error);
