import fs from 'fs';

async function checkPage2() {
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  console.log('Fetching Sayfa=2...');
  const res = await fetch('https://antalyatuted.org.tr/Fiyat/Index?Sayfa=2', { headers: HEADERS });
  const html = await res.text();
  
  const regex = /<td>\s*<a href="\/file\/pdf\/[^"]+" target="_blank">\s*(\d{2}\.\d{2}\.\d{4})[^<]*<\/a>\s*<\/td>\s*<td>\s*\d{2}\.\d{2}\.\d{4}\s*<\/td>\s*<td>\s*<a href="([^"]+)">Excel'e İndir<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    console.log(`Date: ${match[1]} | Link: ${match[2]}`);
  }
}

checkPage2().catch(console.error);
