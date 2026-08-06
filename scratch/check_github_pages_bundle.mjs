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

async function checkGhPages() {
  console.log('Checking GitHub Pages live index.html...');
  const htmlRes = await checkUrl('https://umutbarancicek.github.io/Hotel-Inventory-Management/');
  console.log('HTML status:', htmlRes.status);

  const jsMatch = htmlRes.data.match(/assets\/index-[A-Za-z0-9_-]+\.js/);
  if (jsMatch) {
    console.log('Live JS bundle path:', jsMatch[0]);
    const jsUrl = `https://umutbarancicek.github.io/Hotel-Inventory-Management/${jsMatch[0]}`;
    const jsRes = await checkUrl(jsUrl);
    console.log('Does live JS bundle contain fixed parsePrice for renderFiyat?');
    console.log(jsRes.data.includes('parsePrice(p.price)'));
  } else {
    console.log('Could not find JS bundle in live HTML.');
  }
}

checkGhPages();
