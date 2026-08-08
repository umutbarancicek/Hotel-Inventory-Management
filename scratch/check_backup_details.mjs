import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

// Filter all Karpuz/Kavun on 17.06.2026 (or 2026-06-17)
const checkDates = ['2026-06-17', '2026-06-10', '2026-06-12', '2026-06-15', '2026-06-22'];
checkDates.forEach(date => {
  console.log(`\nTransactions in backup for date: ${date}`);
  const match = txs.filter(t => t.date === date && (t.product === 'KARPUZ' || t.product === 'KAVUN'));
  match.forEach(t => {
    console.log(`  Hotel: ${t.hotel} | Product: ${t.product} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
  });
});
