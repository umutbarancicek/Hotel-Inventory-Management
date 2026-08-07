import https from 'https';

function downloadPdf(url) {
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
    const pageHtmlBuf = await downloadPdf(`https://antalyatuted.org.tr/Fiyat/Index?Sayfa=${page}`);
    const htmlStr = pageHtmlBuf.toString('utf-8');
    if (htmlStr.includes('24.04.2026')) {
      console.log(`Found 24.04.2026 on Page ${page}!`);
      const regex = /<td>\s*<a href="(\/file\/pdf\/[^"]+)" target="_blank">\s*24\.04\.2026[^<]*<\/a>/g;
      const match = regex.exec(htmlStr);
      if (match) {
        console.log('PDF URL:', match[1]);
      } else {
        console.log('Regex did not match, printing surrounding HTML:');
        const idx = htmlStr.indexOf('24.04.2026');
        console.log(htmlStr.slice(idx - 100, idx + 200));
      }
      return;
    }
  }
  console.log('24.04.2026 not found anywhere!');
}

run().catch(console.error);
