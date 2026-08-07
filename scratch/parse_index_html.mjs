import fs from 'fs';

const html = fs.readFileSync('scratch/tuted_index_live.html', 'utf8');

// Find all hrefs containing Fiyat/Index
const regex = /href="([^"]+)"/g;
let match;
const links = [];
while ((match = regex.exec(html)) !== null) {
  if (match[1].includes('Fiyat/Index') || match[1].includes('excel') || match[1].includes('pdf')) {
    links.push(match[1]);
  }
}

console.log("All matching links in index HTML:");
console.log(links.slice(0, 30));

// Also let's print some lines around table rows
const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Index?p=excel') || line.includes('file/pdf') || line.includes('Excel\'e İndir') || line.includes('excel')) {
    console.log(`L${idx+1}: ${line.trim()}`);
  }
});
