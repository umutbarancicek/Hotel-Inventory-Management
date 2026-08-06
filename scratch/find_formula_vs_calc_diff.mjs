import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const wsVeri = wb.Sheets['VERİ'];

let sumHal = 0;
let sumTedColJ = 0;
let sumTedCalc = 0;

const diffRows = [];

for (let r = 3; r <= 2157; r++) {
  const cellA = wsVeri[`A${r}`]; // Supplier
  const cellB = wsVeri[`B${r}`]; // Date
  const cellC = wsVeri[`C${r}`]; // Product
  const cellD = wsVeri[`D${r}`]; // Qty
  const cellE = wsVeri[`E${r}`]; // Hotel
  const cellG = wsVeri[`G${r}`]; // BuyPrice
  const cellH = wsVeri[`H${r}`]; // SupplyPrice
  const cellI = wsVeri[`I${r}`]; // Hal Tutar
  const cellJ = wsVeri[`J${r}`]; // Tedarik Tutar

  if (cellD && cellD.v > 0) {
    const qty = cellD.v;
    const buyPrice = cellG ? cellG.v : 0;
    const supplyPrice = cellH ? cellH.v : 0;
    const halTutar = cellI ? cellI.v : (qty * buyPrice);
    const tedTutar = cellJ ? cellJ.v : (qty * supplyPrice);

    sumHal += halTutar;
    sumTedColJ += tedTutar;
    
    const calcTed = qty * supplyPrice;
    sumTedCalc += calcTed;

    if (Math.abs(tedTutar - calcTed) > 0.1) {
      diffRows.push({
        row: r,
        prod: cellC ? cellC.v : '',
        hotel: cellE ? cellE.v : '',
        qty,
        supplyPrice,
        cellJ: tedTutar,
        calcTed
      });
    }
  }
}

console.log(`Sum of Hal Tutar (I3:I2157): ₺${sumHal.toFixed(2)}`);
console.log(`Sum of Tedarik Tutar (J3:J2157): ₺${sumTedColJ.toFixed(2)}`);
console.log(`Sum of Calc Tedarik (D * H): ₺${sumTedCalc.toFixed(2)}`);
console.log(`\nFound ${diffRows.length} rows where Cell J differs from Qty * SupplyPrice:`);
diffRows.slice(0, 10).forEach(d => {
  console.log(`Row ${d.row}: ${d.hotel} | ${d.prod} | Qty: ${d.qty} | SupplyPrice: ${d.supplyPrice} | Cell J: ₺${d.cellJ} | Calc: ₺${d.calcTed}`);
});
