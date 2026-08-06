import fs from 'fs';

console.log('Checking perfect_reimport_ertaslar.mjs...');
if (fs.existsSync('C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\scratch\\perfect_reimport_ertaslar.mjs')) {
  const content = fs.readFileSync('C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\scratch\\perfect_reimport_ertaslar.mjs', 'utf8');
  console.log(content.slice(0, 500));
}
