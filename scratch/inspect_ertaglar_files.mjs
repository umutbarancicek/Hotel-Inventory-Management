import fs from 'fs';
import path from 'path';

function searchFiles(dir, pattern) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(searchFiles(fullPath, pattern));
        } else if (file.toLowerCase().includes(pattern.toLowerCase())) {
          results.push(fullPath);
        }
      } catch (e) {}
    });
  } catch (e) {}
  return results;
}

console.log('Searching Desktop for Ertaşlar files...');
const desktopFiles = searchFiles('C:\\Users\\Baran\\Desktop', 'ertaşlar');
console.log('Desktop Ertaşlar files:', desktopFiles);

console.log('Searching Downloads for Ertaşlar files...');
const downloadFiles = searchFiles('C:\\Users\\Baran\\Downloads', 'ertaşlar');
console.log('Downloads Ertaşlar files:', downloadFiles);
