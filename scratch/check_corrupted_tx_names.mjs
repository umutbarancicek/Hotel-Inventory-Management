import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

const match = txs.filter(t => {
  const name = (t.product || '').toUpperCase();
  return name.includes('BERRY') || name.includes('AHUDUDU') || name.includes('BÖĞÜRTLEN') || name.includes('MİNİ') || name.includes('FRENK') || name.includes('ÇİLEK');
});

console.log(`Matched transactions count: ${match.length}`);
const uniqueProducts = [...new Set(match.map(t => t.product))];
console.log('Unique product names in transactions:', uniqueProducts);

console.log('\nSamples:');
match.slice(0, 10).forEach(t => {
  console.log(`  Date: ${t.date} | Product: "${t.product}" | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
});
