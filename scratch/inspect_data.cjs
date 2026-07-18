const fs = require('fs');
const path = require('path');
const content = fs.readFileSync('initialData.js', 'utf8');

const js = content.replace('export const INITIAL_DATA =', 'module.exports =');
const tmpPath = path.join(__dirname, 'tmp_data.cjs');
fs.writeFileSync(tmpPath, js);

const initData = require(tmpPath);
console.log('PriceLists keys:', Object.keys(initData.priceLists || {}));
console.log('Sample transaction dates:', initData.transactions ? initData.transactions.slice(0, 5).map(t => ({ date: t.date, prod: t.product, buy: t.buyPrice })) : 'No txs');

if (initData.priceLists) {
  Object.keys(initData.priceLists).forEach(k => {
    console.log(`Key: "${k}", count: ${initData.priceLists[k].length}`);
    const matchElma = initData.priceLists[k].find(p => p.product.includes('ELMA'));
    if (matchElma) console.log(`  Elma in "${k}":`, matchElma);
  });
}
