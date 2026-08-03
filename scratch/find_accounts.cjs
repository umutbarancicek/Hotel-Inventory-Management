const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../initialData.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find accounts section
const accIdx = content.indexOf('"accounts"');
if (accIdx !== -1) {
  console.log('\nAccounts section:\n', content.substring(accIdx, accIdx + 800));
}
