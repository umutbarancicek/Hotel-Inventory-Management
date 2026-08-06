import { INITIAL_DATA } from '../initialData.js';

console.log('=== INITIAL_DATA KEYS ===');
console.log(Object.keys(INITIAL_DATA));

if (INITIAL_DATA.priceLists) {
  const dates = Object.keys(INITIAL_DATA.priceLists).sort();
  console.log(`INITIAL_DATA has ${dates.length} priceLists!`);
  console.log('Sample dates:', dates.slice(0, 10));
} else {
  console.log('INITIAL_DATA does NOT have priceLists.');
}
