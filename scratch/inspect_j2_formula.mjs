import fs from 'fs';
import * as XLSX from 'xlsx';

const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
const buf = fs.readFileSync(xlsmPath);
const wb = XLSX.read(buf, { type: 'buffer', cellFormulas: true });
const wsVeri = wb.Sheets['VERİ'];

console.log('Cell J2 (Column J, Row 2):', wsVeri['J2']);
console.log('Cell I2 (Column I, Row 2):', wsVeri['I2']);
console.log('Cell K2 (Column K, Row 2):', wsVeri['K2']);

// Check row count and exact formula ranges
const range = XLSX.utils.decode_range(wsVeri['!ref']);
console.log('Sheet VERİ Range:', wsVeri['!ref']);
