import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf-8');
const lines = content.split('\n');

console.log('Search results for TÜTED fetch / fetchPrice in main.js:');
lines.forEach((line, idx) => {
  if (line.includes('fetchPrice') || line.includes('tuted') || line.includes('TÜTED') || line.includes('antalya') || line.includes('hal.gov') || line.includes('proxy') || line.includes('fetch(') ) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
