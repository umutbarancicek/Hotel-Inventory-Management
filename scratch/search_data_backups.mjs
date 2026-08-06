import fs from 'fs';
import path from 'path';

function searchFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    try {
      const stat = fs.statSync(full);
      if (stat.isFile() && (item.endsWith('.json') || item.endsWith('.mjs') || item.includes('backup') || item.includes('data'))) {
        results.push({ path: full, size: stat.size, mtime: stat.mtime });
      }
    } catch (e) {}
  }
  return results;
}

console.log('Scratch backups:', searchFiles('C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\scratch'));
console.log('User downloads:', searchFiles('C:\\Users\\Baran\\Downloads'));
