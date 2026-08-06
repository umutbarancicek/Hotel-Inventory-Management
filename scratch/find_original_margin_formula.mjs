import { execSync } from 'child_process';

const gitPath = 'C:\\Users\\Baran\\AppData\\Local\\GitHubDesktop\\app-3.6.3\\resources\\app\\git\\cmd\\git.exe';
const oldMainContent = execSync(`"${gitPath}" show 3560422:main.js`, { cwd: 'C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management' }).toString();

const lines = oldMainContent.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('margin') || line.includes('supply') || line.includes('SEAPHORIA') || line.includes('1.') || line.includes('0.')) {
    if (line.includes('Price') || line.includes('Hotel') || line.includes('hotel') || line.includes('tuted') || line.includes('Tuted')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
