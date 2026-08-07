import https from 'https';
import fs from 'fs';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  const html = await fetchUrl('https://antalyatuted.org.tr/Fiyat/Index?Sayfa=1');
  fs.writeFileSync('scratch/tuted_index_live.html', html);
  console.log('Saved live index to scratch/tuted_index_live.html. Length:', html.length);
}

run().catch(console.error);
