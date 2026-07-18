const fs = require('fs');
const content = fs.readFileSync('main.js', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('.sort(')) {
    console.log(`Line ${idx+1}:`, line.trim());
  }
});
