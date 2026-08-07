import https from 'https';
import fs from 'fs';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      console.log(`URL: ${url} | Status: ${res.statusCode} | Headers:`, res.headers);
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  const buf = await fetchUrl('https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=35330');
  console.log('Fetched buffer length:', buf.length);
}

run().catch(console.error);
