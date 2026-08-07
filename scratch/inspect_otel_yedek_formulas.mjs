import fs from 'fs';
import * as XLSX from 'xlsx';

const pathOtelYedek = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";

async function inspectOtelYedek() {
  const buf = fs.readFileSync(pathOtelYedek);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(2).filter(r => r[0] && r[1] && r[2] && r[3] > 0);

  console.log('Sample rows from otel yedek:');
  rows.slice(0, 15).forEach((r, idx) => {
    // Column indices: 0: MÜSTAHSİL, 1: TARİH, 2: MAL, 3: KİLO, 4: GİTTİĞİ YER, 5: TÜTED, 6: ALIŞ FİAT, 7: TEDA FİAT
    const supplier = r[0];
    const date = r[1];
    const product = r[2];
    const hotel = r[4];
    const tuted = r[5];
    const buy = r[6];
    const supply = r[7];
    
    const marginOfTuted = tuted > 0 ? (supply / tuted) : 0;
    const marginOfBuy = buy > 0 ? (supply / buy) : 0;
    
    console.log(`${idx+3}. Date: ${date} | Hotel: ${hotel} | Prod: ${product} | Tuted: ${tuted} | Buy: ${buy} | Supply: ${supply} | Ratio (Supply/Tuted): ${marginOfTuted.toFixed(4)} | Ratio (Supply/Buy): ${marginOfBuy.toFixed(4)}`);
  });
}

inspectOtelYedek().catch(console.error);
