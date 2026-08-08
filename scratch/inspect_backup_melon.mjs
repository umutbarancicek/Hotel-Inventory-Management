import fs from 'fs';

// Find the backup file in scratch/
const files = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
if (files.length === 0) {
  console.log('No backup file found.');
  process.exit(1);
}

const backupFile = 'scratch/' + files.sort().reverse()[0];
console.log(`Reading backup file: ${backupFile}`);

const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
const melon = txs.filter(t => t.product === 'KARPUZ' || t.product === 'KAVUN');
console.log(`Total Karpuz/Kavun transactions in backup: ${melon.length}`);

console.log('\nSample Karpuz/Kavun records before recalculation:');
melon.slice(0, 15).forEach(t => {
  console.log(`  Date: ${t.date} | Hotel: ${t.hotel} | Product: ${t.product} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
});
