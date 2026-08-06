import fs from 'fs';
import path from 'path';

function findInFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'scratch') {
        findInFiles(fullPath);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('downloadPivotReportExcel')) {
          console.log(`Found in: ${fullPath}`);
        }
      }
    }
  });
}

findInFiles('.');
