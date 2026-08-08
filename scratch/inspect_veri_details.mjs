import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const wsVeri = wb.Sheets['VERİ'];
const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

console.log(`Total raw rows in sheet VERİ: ${rows.length}`);

let validRowsCount = 0;
let emptySupplier = 0;
let emptyDate = 0;
let emptyProduct = 0;
let emptyQty = 0;
let emptyHotel = 0;

rows.slice(2).forEach((r, idx) => {
  if (!r[0]) emptySupplier++;
  if (!r[1]) emptyDate++;
  if (!r[2]) emptyProduct++;
  if (r[3] === undefined || parseFloat(r[3]) <= 0) emptyQty++;
  if (!r[4]) emptyHotel++;

  if (r[0] && r[1] && r[2] && r[3] !== undefined && parseFloat(r[3]) > 0 && r[4]) {
    validRowsCount++;
  }
});

console.log(`Valid rows count (with all fields present and qty > 0): ${validRowsCount}`);
console.log(`Empty Supplier: ${emptySupplier}`);
console.log(`Empty Date: ${emptyDate}`);
console.log(`Empty Product: ${emptyProduct}`);
console.log(`Empty Qty: ${emptyQty}`);
console.log(`Empty Hotel: ${emptyHotel}`);
