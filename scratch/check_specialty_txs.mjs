import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

const targets = ['SOYA FİLİZİ', 'ROZMARİN', 'LOLOROSSO', 'KABAK ÇİÇEĞİ', 'AKDENİZ SALATA'];
const match = txs.filter(t => targets.includes((t.product || '').toUpperCase().trim()));

console.log(`Found ${match.length} transactions for target products.`);
match.slice(0, 15).forEach(t => {
  console.log(`  Date: ${t.date} | Product: "${t.product}" | Hotel: ${t.hotel} | Qty: ${t.qty} | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
});
