import https from 'https';

function checkHeaders(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      console.log('Status code:', res.statusCode);
      console.log('Headers:', res.headers);
      resolve();
    }).on('error', reject);
  });
}

checkHeaders('https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=35330').catch(console.error);
