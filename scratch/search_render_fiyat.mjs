import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('FİYAT LİSTESİ') || line.includes('renderFiyat') || line.includes('Fiyat Listesi') || line.includes('fiyat-listesi')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
