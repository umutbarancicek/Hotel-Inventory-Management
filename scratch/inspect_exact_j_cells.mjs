import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer', cellFormulas: true });
const wsVeri = wb.Sheets['VERİ'];

let sumJCells = 0;
let sumJFormulas = 0;

for (let r = 3; r <= 2157; r++) {
  const cellAddress = `J${r}`;
  const cell = wsVeri[cellAddress];
  if (cell) {
    const val = typeof cell.v === 'number' ? cell.v : parseFloat(cell.v) || 0;
    sumJCells += val;
  }
}

console.log(`Sum of J3:J2157 cells from XLSX object: ₺${sumJCells.toFixed(2)}`);
