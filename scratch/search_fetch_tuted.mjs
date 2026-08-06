import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('fetch-tuted') || line.includes('fetchTuted') || line.includes('tuted') || line.includes('Tuted') || line.includes('Borsa')) {
    if (line.includes('btn') || line.includes('click') || line.includes('function') || line.includes('const') || line.includes('async')) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
