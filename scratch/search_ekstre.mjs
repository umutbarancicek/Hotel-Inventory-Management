import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.toUpperCase().includes('EKSTRE') || line.includes('renderAccount') || line.includes('openAccount') || line.includes('AccountStatement')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
