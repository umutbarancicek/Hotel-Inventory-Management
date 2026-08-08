import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('priceLists') || line.includes('priceList')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});
