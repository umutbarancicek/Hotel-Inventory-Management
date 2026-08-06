import fs from 'fs';

const cssFiles = ['index.css', 'style.css', 'src/index.css', 'src/style.css'];
cssFiles.forEach(f => {
  const p = `C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\${f}`;
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('.btn-black') || line.includes('btn-black')) {
        console.log(`${f} Line ${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
