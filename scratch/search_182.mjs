import fs from 'fs';

const files = ['main.js', 'dataService.js', 'index.html'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('1.82') || line.includes('182')) {
        console.log(`${file}:${idx+1}: ${line.trim()}`);
      }
    });
  }
});
