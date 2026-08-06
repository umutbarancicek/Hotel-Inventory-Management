import https from 'https';
import * as XLSX from 'xlsx';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function test() {
  try {
    console.log('Fetching Excel...');
    const buf = await fetchUrl('https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=38346');
    console.log('Response size:', buf.length);
    const wb = XLSX.read(buf, { type: 'buffer' });
    console.log('Sheets in workbook:', wb.SheetNames);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log('Row count:', data.length);
    console.log('Sample rows:', data.slice(0, 5));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
