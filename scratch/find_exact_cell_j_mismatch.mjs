import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const wsVeri = wb.Sheets['VERİ'];

let sumDirectCellJ = 0;
let sumQtyTimesSupply = 0;

const diffs = [];

for (let r = 3; r <= 2157; r++) {
  const cellA = wsVeri[`A${r}`]; // Supplier
  const cellB = wsVeri[`B${r}`]; // Date
  const cellC = wsVeri[`C${r}`]; // Product
  const cellD = wsVeri[`D${r}`]; // Qty
  const cellE = wsVeri[`E${r}`]; // Hotel
  const cellG = wsVeri[`G${r}`]; // BuyPrice
  const cellH = wsVeri[`H${r}`]; // SupplyPrice
  const cellJ = wsVeri[`J${r}`]; // Tedarik Tutar

  if (cellD && cellD.v > 0) {
    const qty = cellD.v;
    const supplyPrice = cellH ? cellH.v : 0;
    const directJ = cellJ ? cellJ.v : 0;
    const calcJ = qty * supplyPrice;

    sumDirectCellJ += directJ;
    sumQtyTimesSupply += calcJ;

    if (Math.abs(directJ - calcJ) > 0.01) {
      diffs.push({
        row: r,
        hotel: cellE ? cellE.v : '',
        prod: cellC ? cellC.v : '',
        qty,
        supplyPrice,
        directJ,
        calcJ,
        diff: directJ - calcJ
      });
    }
  }
}

console.log(`Direct Sum of Cell J values (J3:J2157): ₺${sumDirectCellJ.toFixed(2)}`);
console.log(`Sum of (Qty * SupplyPrice) for J3:J2157: ₺${sumQtyTimesSupply.toFixed(2)}`);
console.log(`Found ${diffs.length} rows where Cell J differs from Qty * SupplyPrice:`);
diffs.slice(0, 15).forEach((d, i) => {
  console.log(`${i+1}. Row ${d.row} | ${d.hotel} | ${d.prod} | Qty: ${d.qty} | Teda: ₺${d.supplyPrice} | Cell J: ₺${d.directJ} | Calc: ₺${d.calcJ} | Diff: ₺${d.diff.toFixed(2)}`);
});
