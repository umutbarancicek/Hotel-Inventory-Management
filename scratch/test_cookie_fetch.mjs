import https from 'https';

function getSessionAndExcel(excelUrl) {
  return new Promise((resolve, reject) => {
    // 1. Get Index page to extract cookies
    https.get('https://antalyatuted.org.tr/Fiyat/Index', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const cookies = res.headers['set-cookie'] || [];
      const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
      console.log('Session Cookies extracted:', cookieHeader);

      // 2. Request Excel using cookies
      https.get(excelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Cookie': cookieHeader,
          'Referer': 'https://antalyatuted.org.tr/Fiyat/Index'
        }
      }, (excelRes) => {
        console.log(`Excel Response Status: ${excelRes.statusCode}`);
        console.log(`Excel Headers:`, excelRes.headers);
        const chunks = [];
        excelRes.on('data', chunk => chunks.push(chunk));
        excelRes.on('end', () => resolve({ buf: Buffer.concat(chunks), headers: excelRes.headers }));
      }).on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  const result = await getSessionAndExcel('https://antalyatuted.org.tr/Fiyat/Index?p=excel&id=38350');
  console.log('Result length:', result.buf.length);
  if (result.headers['content-type'].includes('spreadsheet') || result.headers['content-type'].includes('excel') || result.headers['content-type'].includes('octet-stream')) {
    console.log('✅ Success! It is a spreadsheet!');
  } else {
    console.log('❌ Failed! Still HTML or other content type:', result.headers['content-type']);
  }
}

run().catch(console.error);
