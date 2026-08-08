import fs from 'fs';
import path from 'path';

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && !file.startsWith('.')) {
        searchDir(filePath, query);
      }
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(query)) {
        console.log(`Found "${query}" in: ${filePath}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(query)) {
            console.log(`  L${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

searchDir('.', 'priceLists');
searchDir('.', 'items');
