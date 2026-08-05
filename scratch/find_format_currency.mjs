import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('formatCurrency') || line.includes('function formatCurrency')) {
    if (idx < 200) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
