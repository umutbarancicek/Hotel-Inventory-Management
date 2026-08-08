import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

const zeroPrices = txs.filter(t => parseFloat(t.buyPrice) === 0 || parseFloat(t.supplyPrice) === 0);
console.log(`Found ${zeroPrices.length} transactions with zero price:`);
zeroPrices.forEach(t => {
  console.log(`  Date: ${t.date} | Product: "${t.product}" | Hotel: ${t.hotel} | Supplier: ${t.supplier} | Qty: ${t.qty} | Buy: ${t.buyPrice} | Supply: ${t.supplyPrice}`);
});
