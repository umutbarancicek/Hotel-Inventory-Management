import * as XLSX from 'xlsx';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function testJulyTuted() {
  const res = await fetch('https://antalyatuted.org.tr/Fiyat/Index', { headers: HEADERS });
  const html = await res.text();
  
  const regex = /<td>\s*(\d{2}\.\d{2}\.\d{4})\s*<\/td>[\s\S]*?href="(\/Fiyat\/Index\?p=excel&id=\d+)"/g;
  const julyMap = {};
  let match;
  while ((match = regex.exec(html)) !== null) {
    const [_, dStr, url] = match;
    if (dStr.includes('.07.2026')) {
      julyMap[dStr] = url;
    }
  }
  console.log('Found July dates on TÜTED web:', julyMap);

  // Test downloading 07.07.2026
  if (julyMap['07.07.2026']) {
    const excelUrl = 'https://antalyatuted.org.tr' + julyMap['07.07.2026'];
    console.log(`Downloading 07.07.2026 from ${excelUrl}...`);
    const excelRes = await fetch(excelUrl, { headers: HEADERS });
    console.log('Response status:', excelRes.status);
    if (excelRes.ok) {
      const buf = await excelRes.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log('07.07.2026 total rows:', rows.length);
      console.log('Sample rows:');
      rows.slice(0, 15).forEach((r, i) => console.log(`  Row ${i}:`, JSON.stringify(r)));
    }
  }
}

testJulyTuted();
