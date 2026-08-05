import fs from 'fs';
import path from 'path';

const folder = 'C:\\Users\\Baran\\Desktop\\tüted';

try {
  const files = fs.readdirSync(folder);
  console.log(`Files in ${folder}: (${files.length} total)`);
  files.forEach(f => console.log(' -', f));
} catch (err) {
  console.error('Error reading folder:', err.message);
}
