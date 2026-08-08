import fs from 'fs';

const content = fs.readFileSync('initialData.js', 'utf8');
const data = JSON.parse(content.replace('export const INITIAL_DATA = ', '').replace(';', ''));

console.log('Fields in INITIAL_DATA:', Object.keys(data));
if (data.prices) {
  console.log(`INITIAL_DATA.prices length: ${data.prices.length}`);
  console.log('Sample from INITIAL_DATA.prices:', data.prices.slice(0, 5));
}
if (data.priceLists) {
  console.log(`INITIAL_DATA.priceLists exists. Number of dates: ${Object.keys(data.priceLists).length}`);
  const sampleDate = Object.keys(data.priceLists)[0];
  console.log(`Sample date: ${sampleDate}, type of value:`, Array.isArray(data.priceLists[sampleDate]) ? 'Array' : 'Object');
  if (Array.isArray(data.priceLists[sampleDate])) {
    console.log('Sample item:', data.priceLists[sampleDate][0]);
  }
}
