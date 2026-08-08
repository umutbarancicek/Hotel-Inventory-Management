import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
console.log(`Using backup file: ${backupFile}`);

const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

// Let's find transactions with buyPrice > 500
const highBuy = txs.filter(t => t.buyPrice > 500);
console.log(`Total transactions with buyPrice > 500: ${highBuy.length}`);

// Group by product
const products = {};
highBuy.forEach(t => {
  products[t.product] = (products[t.product] || 0) + 1;
});
console.log('Products with high buyPrice:', products);

// Let's see some samples of these high buyPrice transactions
console.log('\nSamples:');
highBuy.slice(0, 20).forEach(t => {
  console.log(`  Date: ${t.date} | Hotel: ${t.hotel} | Product: ${t.product} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
});
