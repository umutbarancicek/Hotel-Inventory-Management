import fs from 'fs';

const files = fs.readdirSync('C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\scratch');
files.forEach(f => {
  if (f.endsWith('.mjs') || f.endsWith('.cjs')) {
    const full = `C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\scratch\\${f}`;
    const content = fs.readFileSync(full, 'utf8');
    if (content.includes('priceLists') && (content.includes('save') || content.includes('data'))) {
      console.log(`Scratch file ${f} has priceLists operations (${fs.statSync(full).mtime.toISOString()})`);
    }
  }
});
