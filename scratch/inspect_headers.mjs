import https from 'https';

https.get('https://antalyatuted.org.tr/Fiyat/Index', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', console.error);
