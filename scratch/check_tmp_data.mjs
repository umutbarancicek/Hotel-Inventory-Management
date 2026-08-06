import fs from 'fs';

// Read scratch/tmp_data.cjs
const content = fs.readFileSync('scratch/tmp_data.cjs', 'utf8');
console.log('Length of scratch/tmp_data.cjs:', content.length);

// We can check if it exports data and what keys it has
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tmpData = require('./tmp_data.cjs');

console.log('Keys in tmpData:', Object.keys(tmpData));
if (tmpData.priceLists) {
  const dates = Object.keys(tmpData.priceLists).sort();
  console.log(`tmpData has ${dates.length} priceLists!`);
  console.log('Sample dates:', dates.slice(0, 15));
} else {
  console.log('tmpData does NOT have priceLists.');
}
