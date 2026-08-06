import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('250') || line.includes('100.0') || line.includes('realTl')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
