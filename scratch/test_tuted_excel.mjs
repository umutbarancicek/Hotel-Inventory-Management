/**
 * Test fetching TÜTED Excel for a specific date and parsing it
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Download Excel file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
        https.get(res.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
      } else {
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }
    }).on('error', reject);
  });
}

const excelUrl = 'https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=38398'; // 04.08.2026
const destFile = path.join(__dirname, 'tuted_test.xls');

console.log('Downloading Excel from TÜTED website...');
await downloadFile(excelUrl, destFile);

const stats = fs.statSync(destFile);
console.log(`Downloaded: ${stats.size} bytes`);

// Try to read it
try {
  const wb = XLSX.readFile(destFile);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  console.log(`Sheet: ${sheetName}`);
  console.log('First 20 rows:');
  data.slice(0, 20).forEach((row, i) => console.log(`Row ${i}: ${JSON.stringify(row)}`));
} catch (e) {
  console.log('XLSX parse error:', e.message);
  // Try reading as text
  const content = fs.readFileSync(destFile, 'utf-8');
  console.log('First 500 chars as text:', content.substring(0, 500));
}
