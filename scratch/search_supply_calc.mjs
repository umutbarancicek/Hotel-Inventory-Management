import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf-8');
const lines = content.split('\n');

console.log('Searching for supply price calculations in main.js:');
lines.forEach((line, index) => {
  if (line.includes('supplyPrice') && (line.includes('*') || line.includes('/') || line.includes('+') || line.includes('rate'))) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});
