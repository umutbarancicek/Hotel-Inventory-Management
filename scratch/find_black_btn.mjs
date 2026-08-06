import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\style.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('--black-btn') || line.includes('--blue-btn')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
