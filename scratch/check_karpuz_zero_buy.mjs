import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

const targets = txs.filter(t => (t.product === 'KARPUZ' || t.product === 'KAVUN') && (t.buyPrice === 0 || t.buyPrice === '0' || t.supplyPrice > 2000));
console.log(`Found ${targets.length} target records:`);
targets.forEach(t => {
  console.log(`  Date: ${t.date} | Product: "${t.product}" | Hotel: ${t.hotel} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
});
