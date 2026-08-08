import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf-8');
const lines = content.split('\n');

console.log('Search results for "parsePrice" in main.js:');
lines.forEach((line, idx) => {
  if (line.includes('parsePrice')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
