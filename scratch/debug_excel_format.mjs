/**
 * Debug Excel parsing - download one file and inspect the raw structure
 */
import https from 'https';
import http from 'http';
import * as XLSX from 'xlsx';

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBinary(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Test TWO files: one recent (July, works) and one old (April, fails)
const files = [
  { date: '2026-08-04', id: '38398' }, // Recent - works
  { date: '2026-04-24', id: '35330' }, // Old - fails
];

for (const f of files) {
  console.log(`\n========== ${f.date} (id=${f.id}) ==========`);
  const url = `https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=${f.id}`;
  const buffer = await fetchBinary(url);
  console.log(`Size: ${buffer.length} bytes`);
  
  // Check file signature
  const sig = buffer.slice(0, 8).toString('hex');
  console.log(`File signature: ${sig}`);
  
  // Check if it's HTML
  const startText = buffer.slice(0, 200).toString('utf-8');
  if (startText.includes('<') || startText.includes('html')) {
    console.log('>>> LOOKS LIKE HTML/XML:');
    console.log(startText);
    continue;
  }
  
  // Try all XLSX read modes
  try {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    console.log(`Sheets: ${wb.SheetNames.join(', ')}`);
    
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    
    console.log(`Total rows: ${rows.length}`);
    console.log('First 15 rows:');
    rows.slice(0, 15).forEach((row, i) => {
      if (row.some(c => c !== '')) {
        console.log(`  Row ${i}: ${JSON.stringify(row)}`);
      }
    });
    
    // Show all non-empty rows
    console.log(`\nAll non-empty rows (first 30):`);
    rows.filter(r => r.some(c => c !== '')).slice(0, 30).forEach((row, i) => {
      console.log(`  ${JSON.stringify(row)}`);
    });
    
  } catch (e) {
    console.log(`XLSX error: ${e.message}`);
  }
}
