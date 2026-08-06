import fs from 'fs';

const wfPath = 'C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\.github\\workflows';
if (fs.existsSync(wfPath)) {
  console.log('Workflows:', fs.readdirSync(wfPath));
} else {
  console.log('No .github/workflows directory found.');
}
