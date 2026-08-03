const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../initialData.js');
let content = fs.readFileSync(filePath, 'utf8');

// Convert to module for parsing
const jsContent = content.replace('export const INITIAL_DATA =', 'module.exports =');
const tmpPath = path.join(__dirname, 'tmp_init_acc.cjs');
fs.writeFileSync(tmpPath, jsContent);

const data = require(tmpPath);

// Print all accounts
console.log('Current accounts:');
data.accounts.forEach((a, i) => console.log(i, JSON.stringify(a)));

// Check if ERTAŞLAR already exists
const exists = data.accounts.find(a => a.name.toUpperCase().includes('ERTAŞLAR'));
console.log('\nERTAŞLAR already exists?', exists ? 'YES' : 'NO');

fs.unlinkSync(tmpPath);
