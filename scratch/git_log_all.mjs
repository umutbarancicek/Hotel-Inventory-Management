import { execSync } from 'child_process';

const gitPath = 'C:\\Users\\Baran\\AppData\\Local\\GitHubDesktop\\app-3.6.3\\resources\\app\\git\\cmd\\git.exe';
const log = execSync(`"${gitPath}" log --oneline -n 30`, { cwd: 'C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management' }).toString();

console.log('GIT COMMIT HISTORY:');
console.log(log);
