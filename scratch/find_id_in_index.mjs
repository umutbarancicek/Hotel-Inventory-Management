import https from 'https';

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
  for (let page = 1; page <= 6; page++) {
    const pageHtmlBuf = await fetchUrl(`https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${page}`);
    const htmlStr = pageHtmlBuf.toString('utf-8');
    if (htmlStr.includes('id=38350') || htmlStr.includes('38350')) {
      console.log(`Found 38350 on Page ${page}!`);
      // Print lines around 38350
      const lines = htmlStr.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('38350')) {
          console.log(lines.slice(idx - 2, idx + 4).join('\n'));
        }
      });
      return;
    }
  }
  console.log('ID 38350 not found on pages 1-6!');
}

run().catch(console.error);
