/**
 * Deep inspect one TÜTED Excel file to understand exact column structure
 */
import https from 'https';
import * as XLSX from 'xlsx';

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBinary(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

// 2026-08-04 Excel
const url = 'https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=38398';
console.log('Downloading...');
const buffer = await fetchBinary(url);
console.log(`Size: ${buffer.length} bytes, sig: ${buffer.slice(0,4).toString('hex')}`);

const wb = XLSX.read(buffer, { type: 'buffer' });
console.log(`Sheets: ${wb.SheetNames.join(', ')}`);

const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log(`\nTotal rows: ${rows.length}`);
console.log('\n--- ALL NON-EMPTY ROWS ---');
rows.forEach((row, i) => {
  if (row.some(c => c !== '')) {
    console.log(`Row ${String(i).padStart(3)}: ${JSON.stringify(row)}`);
  }
});
