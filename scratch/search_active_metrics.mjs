import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('activeMetrics') || line.includes('activeDims') || line.includes('pivotState.fields')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
