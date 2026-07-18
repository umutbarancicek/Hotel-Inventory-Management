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
    console.log('Index status:', res.status);
    
    // Find Excel links or date selectors in HTML
    const excelMatches = [...res.body.matchAll(/href="([^"]*excel[^"]*)"/gi)];
    console.log('Excel matches:', excelMatches.map(m => m[1]));

    const dateMatches = [...res.body.matchAll(/(\d{2}\.\d{2}\.\d{4})/g)];
    console.log('Date matches sample:', dateMatches.slice(0, 10).map(m => m[1]));

    // Check if there are form parameters or archive URLs for specific dates
    const selectMatches = [...res.body.matchAll(/<select[^>]*>([\s\S]*?)<\/select>/gi)];
    console.log('Select count:', selectMatches.length);
    selectMatches.forEach((s, idx) => {
      const options = [...s[1].matchAll(/<option[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi)];
      console.log(`Select #${idx+1} options count: ${options.length}, sample:`, options.slice(0, 5).map(o => ({ val: o[1], txt: o[2].trim() })));
    });

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

main();
