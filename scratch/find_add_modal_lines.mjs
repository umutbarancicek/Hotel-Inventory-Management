import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf-8');
const lines = content.split('\n');

console.log('Search results for "Ekle" or "addTx" in main.js:');
lines.forEach((line, idx) => {
  if (line.includes('Ekle') || line.includes('addTx') || line.includes('openAdd') || line.includes('add-tx') || line.includes('İşlem Ekle')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
