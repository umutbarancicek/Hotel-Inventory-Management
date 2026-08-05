import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\main.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('function renderVeri') || line.includes('window.renderVeri')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
