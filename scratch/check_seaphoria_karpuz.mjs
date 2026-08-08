import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

const seaphoriaKarpuz = txs.filter(t => (t.hotel || '').toUpperCase().includes('SEAPHOR') && t.product === 'KARPUZ');
console.log(`Total Seaphoria Karpuz transactions in backup: ${seaphoriaKarpuz.length}`);
seaphoriaKarpuz.forEach(t => {
  console.log(`  Date: ${t.date} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
});
