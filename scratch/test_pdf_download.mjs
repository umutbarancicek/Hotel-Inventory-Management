import https from 'https';

function checkPdf(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      console.log(`PDF Status: ${res.statusCode} | Length: ${res.headers['content-length']} | Content-Type: ${res.headers['content-type']}`);
      resolve(res.statusCode);
    }).on('error', reject);
  });
}

run().catch(console.error);

async function run() {
  await checkPdf('https://antalyatuted.org.tr/file/pdf/e659f44a-8043-41d4-a2f5-4f3f30238773.pdf');
}
