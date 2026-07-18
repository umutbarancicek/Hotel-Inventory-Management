const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  try {
    const res = await fetchUrl('https://antalyatuted.org.tr/Fiyat/Index');
    const htmlText = res.body;

    const regex = /<td>\s*(\d{2}\.\d{2}\.\d{4})\s*<\/td>[\s\S]*?href="(\/Fiyat\/Index\?p=excel&id=\d+)"/g;
    const dateMap = [];
    let match;
    while ((match = regex.exec(htmlText)) !== null) {
      const [_, dStr, url] = match;
      const [d, m, y] = dStr.split('.');
      const iso = `${y}-${m}-${d}`;
      dateMap.push({ dStr, iso, url });
    }

    console.log(`Successfully parsed ${dateMap.length} date-to-excel mappings from TÜTED!`);
    console.log('Sample mappings:', dateMap.slice(0, 5));

    // Test lookup for 17.07.2026
    const targetIso = '2026-07-17';
    const found = dateMap.find(e => e.iso === targetIso);
    console.log(`Lookup for ${targetIso}:`, found);

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
