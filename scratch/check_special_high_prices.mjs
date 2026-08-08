import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

const special = txs.filter(t => t.buyPrice > 500 && t.product !== 'KARPUZ');
console.log('Special transactions:');
special.forEach(t => {
  console.log(`  Date: ${t.date} | Hotel: ${t.hotel} | Product: ${t.product} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
});
