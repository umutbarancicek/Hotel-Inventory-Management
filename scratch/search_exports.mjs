import fs from 'fs';

const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('export') || line.includes('Excel') || line.includes('xlsx') || line.includes('XLSX') || line.includes('print') || line.includes('pdf') || line.includes('PDF')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
