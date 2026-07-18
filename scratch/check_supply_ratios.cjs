const fs = require('fs');
const content = fs.readFileSync('initialData.js', 'utf8');

const js = content.replace('export const INITIAL_DATA =', 'module.exports =');
const tmpPath = 'scratch/tmp_init.cjs';
fs.writeFileSync(tmpPath, js);

const initData = require('./tmp_init.cjs');
console.log('Total transactions:', initData.transactions.length);

const hotelRatios = {};
initData.transactions.forEach(t => {
  if (t.buyPrice && t.supplyPrice) {
    const ratio = t.supplyPrice / t.buyPrice;
    if (!hotelRatios[t.hotel]) hotelRatios[t.hotel] = [];
    hotelRatios[t.hotel].push(ratio);
  }
});

Object.keys(hotelRatios).forEach(h => {
  const list = hotelRatios[h];
  const avg = list.reduce((a,b)=>a+b,0) / list.length;
  console.log(`Hotel: "${h}", sample count: ${list.length}, avg ratio vs buyPrice: ${avg.toFixed(4)}, sample ratios:`, list.slice(0, 5).map(r => r.toFixed(4)));
});

fs.unlinkSync(tmpPath);
