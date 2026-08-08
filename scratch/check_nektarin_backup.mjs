import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

const matches = txs.filter(t => t.date === '2026-07-11' && (t.product || '').toUpperCase().includes('NEKTAR'));
console.log('Nektarin in backup for 2026-07-11:');
matches.forEach(t => {
  console.log(`  Supplier: ${t.supplier} | Hotel: ${t.hotel} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
});
