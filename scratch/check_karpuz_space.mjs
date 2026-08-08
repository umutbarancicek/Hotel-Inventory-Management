import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

txs.forEach(t => {
  if (t.date === '2026-06-20' && (t.product || '').toUpperCase().includes('KARP')) {
    console.log(`Product: "${t.product}" | Hotel: "${t.hotel}" | Qty: ${t.qty} | BuyPrice: ${t.buyPrice}`);
  }
});
