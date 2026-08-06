import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('btn-fetch-tuted') || line.includes('tutedBtn')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
