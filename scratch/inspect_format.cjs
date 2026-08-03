const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../initialData.js');
let content = fs.readFileSync(filePath, 'utf8');

// Check the format of accounts in the file
const idx = content.indexOf('"METİN DALKIRAN"');
if (idx !== -1) {
  console.log('Found METİN DALKIRAN at index:', idx);
  console.log('Context:\n', content.substring(idx - 20, idx + 60));
} else {
  console.log('METİN DALKIRAN NOT FOUND! Checking alternatives...');
  const idx2 = content.indexOf('DALKIRAN');
  if (idx2 !== -1) {
    console.log('Context:\n', content.substring(idx2 - 40, idx2 + 80));
  }
  
  // Look for accounts section
  const accIdx = content.indexOf('"accounts"');
  if (accIdx !== -1) {
    console.log('\nAccounts section:\n', content.substring(accIdx, accIdx + 500));
  }
}
