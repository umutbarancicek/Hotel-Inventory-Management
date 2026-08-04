// Test direct TÜTED access without proxy
const res = await fetch('https://antalyatuted.org.tr/Fiyat/Index', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  }
});
console.log('Status:', res.status, res.statusText);
if (res.ok) {
  const html = await res.text();
  const regex = /<td>\s*(\d{2}\.\d{2}\.\d{4})\s*<\/td>[\s\S]*?href="(\/Fiyat\/Index\?p=excel&id=\d+)"/g;
  const dates = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    dates.push({ date: match[1], url: match[2] });
  }
  console.log('Found dates:', dates.slice(0, 10));
} else {
  const text = await res.text();
  console.log('Response body (first 500):', text.slice(0, 500));
}
