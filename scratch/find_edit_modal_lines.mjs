import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf-8');
const lines = content.split('\n');

console.log('Search results for "Düzenle" or "edit" in main.js:');
lines.forEach((line, idx) => {
  if (line.includes('Düzenle') || line.includes('editTx') || line.includes('openEdit') || line.includes('edit-tx') || line.includes('İşlem Düzenle')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
