import https from 'https';

const proxies = [
  ['crossorigin.me', 'https://crossorigin.me/https://antalyatuted.org.tr/Fiyat/Index'],
  ['codetabs', 'https://api.codetabs.com/v1/proxy?quest=https://antalyatuted.org.tr/Fiyat/Index'],
  ['yacdn', 'https://yacdn.org/serve/https://antalyatuted.org.tr/Fiyat/Index'],
  ['cors.eu.org', 'https://cors.eu.org/https://antalyatuted.org.tr/Fiyat/Index'],
  ['corsproxy.io-get', 'https://corsproxy.io/?https://antalyatuted.org.tr/Fiyat/Index'],
];

for (const [label, testUrl] of proxies) {
  await new Promise(resolve => {
    const req = https.get(testUrl, { timeout: 8000 }, (res) => {
      console.log(`${label}: Status ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = /<td>\s*(\d{2}\.\d{2}\.\d{4})\s*<\/td>/g;
        const dates = [];
        let m;
        while ((m = regex.exec(data)) !== null) dates.push(m[1]);
        if (dates.length > 0) console.log(`  ✅ WORKING! Dates:`, dates.slice(0,3));
        else console.log(`  ❌ No dates found. Snippet:`, data.slice(0, 100));
        resolve();
      });
    });
    req.on('error', e => { console.log(`${label} ERROR: ${e.message}`); resolve(); });
    req.on('timeout', () => { req.destroy(); console.log(`${label} TIMEOUT`); resolve(); });
  });
}
