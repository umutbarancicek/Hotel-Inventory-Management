import https from 'https';

// Test cors-anywhere with proper demo unlock
const proxies = [
  // cors-anywhere demo (requires visiting /corsdemo first to unlock)
  ['cors-anywhere-demo', 'https://cors-anywhere.herokuapp.com/https://antalyatuted.org.tr/Fiyat/Index', 
   { 'Origin': 'https://baranbayhan.github.io', 'X-Requested-With': 'XMLHttpRequest', 'x-cors-api-key': 'temp_demo' }],
  // try without header
  ['proxy.io', 'https://proxy.io/proxy/direct/?q=aHR0cHM6Ly9hbnRhbHlhdHV0ZWQub3JnLnRyL0ZpeWF0L0luZGV4', {}],
  // Free cors proxy - no key
  ['nocors.dev', 'https://nocors.dev/api/proxy?url=https%3A%2F%2Fantalyatuted.org.tr%2FFiyat%2FIndex', {}],
];

for (const [label, testUrl, headers] of proxies) {
  await new Promise(resolve => {
    const req = https.get(testUrl, { timeout: 8000, headers }, (res) => {
      console.log(`${label}: Status ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = /<td>\s*(\d{2}\.\d{2}\.\d{4})\s*<\/td>/g;
        const dates = [];
        let m;
        while ((m = regex.exec(data)) !== null) dates.push(m[1]);
        if (dates.length > 0) console.log(`  ✅ WORKING! Dates:`, dates.slice(0,3));
        else console.log(`  ❌ No dates. Snippet:`, data.slice(0, 150));
        resolve();
      });
    });
    req.on('error', e => { console.log(`${label} ERROR: ${e.message}`); resolve(); });
    req.on('timeout', () => { req.destroy(); console.log(`${label} TIMEOUT`); resolve(); });
  });
}
