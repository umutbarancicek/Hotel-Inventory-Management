import https from 'https';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', () => resolve({ status: 500, data: '' }));
  });
}

async function pollGhPages() {
  console.log('Polling GitHub Pages live deployment status...');
  for (let attempt = 1; attempt <= 12; attempt++) {
    const htmlRes = await checkUrl(`https://umutbarancicek.github.io/Hotel-Inventory-Management/?cachebust=${Date.now()}`);
    const jsMatch = htmlRes.data.match(/assets\/index-[A-Za-z0-9_-]+\.js/);
    if (jsMatch) {
      const jsUrl = `https://umutbarancicek.github.io/Hotel-Inventory-Management/${jsMatch[0]}?cachebust=${Date.now()}`;
      const jsRes = await checkUrl(jsUrl);
      const isFixed = jsRes.data.includes('parsePrice(p.price)');
      console.log(`Attempt ${attempt}: Live bundle = ${jsMatch[0]} | Contains fix? ${isFixed}`);
      if (isFixed) {
        console.log('🎉 SUCCESS! Fixed bundle is LIVE on GitHub Pages!');
        return;
      }
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log('Polled 120s, waiting for deployment to complete...');
}

pollGhPages();
