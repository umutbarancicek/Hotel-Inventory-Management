import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('const pivotState') || line.includes('let pivotState') || line.includes('window.pivotState')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});

// Let's also print lines 1600 to 1700 of main.js to see where pivotState is defined
const range = lines.slice(1400, 1680);
range.forEach((line, idx) => {
  if (line.includes('pivotState') || line.includes('fields:')) {
    console.log(`[L${idx+1401}] ${line.trim()}`);
  }
});
