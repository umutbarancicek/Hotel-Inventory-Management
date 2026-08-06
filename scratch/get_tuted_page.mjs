import fs from 'fs';

async function getTutedPage() {
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  console.log('Fetching Fiyat/Index...');
  const res = await fetch('https://antalyatuted.org.tr/Fiyat/Index', { headers: HEADERS });
  const html = await res.text();
  fs.writeFileSync('scratch/tuted_index.html', html);
  console.log('Saved html to scratch/tuted_index.html. Length:', html.length);
}

getTutedPage().catch(console.error);
