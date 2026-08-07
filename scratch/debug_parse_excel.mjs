import https from 'https';
import * as XLSX from 'xlsx';

function fetchUrl(url, isExcel = false) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };
    if (isExcel) {
      headers['Referer'] = 'https://antalyatuted.org.tr/Fiyat/Index';
    }
    https.get(url, { headers }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  const excelBuf = await fetchUrl('https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=38350', true);
  console.log('Excel file size:', excelBuf.length);

  // Print first 500 chars if it is HTML
  const text = excelBuf.toString('utf8');
  if (text.startsWith('<!DOCTYPE') || text.includes('<html')) {
    console.log('❌ FAILED: The returned file is HTML, not Excel!');
    console.log(text.slice(0, 1000));
  } else {
    const wb = XLSX.read(excelBuf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('✅ SUCCESS! Sheet Rows count:', sheetData.length);
    console.log('First 5 rows:', sheetData.slice(0, 5));
  }
}

run().catch(console.error);
