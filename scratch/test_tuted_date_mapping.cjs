const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function main() {
  try {
    const res = await fetchUrl('https://antalyatuted.org.tr/Fiyat/Index');
    
    // Let's inspect snippet around excel links
    const lines = res.body.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('p=excel')) {
        console.log(`Line ${idx}:`, line.trim());
        // Print 3 lines before and after
        for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 3); i++) {
          console.log(`  [${i}]`, lines[i].trim());
        }
        console.log('---');
      }
    });

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

main();
