import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\main.js', 'utf8');
const lines = content.split('\n');

for (let i = 450; i < 550; i++) {
  console.log(`Line ${i + 1}: ${lines[i]}`);
}
