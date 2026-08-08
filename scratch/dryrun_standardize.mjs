/**
 * DRY-RUN: Standardize Karpuz/Kavun transactions to kilograms and split grouped transactions
 */
import fs from 'fs';

const backupFiles = fs.readdirSync('scratch').filter(f => f.startsWith('backup_before_recalc_'));
const backupFile = 'scratch/' + backupFiles.sort().reverse()[0];
console.log(`Using backup file: ${backupFile}`);
const txs = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

const CASAFORA_SEAPHORIA = new Set(['CASAFORA', 'SEAPHORİA', 'SEAPHORIA']);

// We will simulate the transformation:
const transformed = [];
let convertedCount = 0;
let splitCount = 0;

txs.forEach(t => {
  const isMelon = t.product === 'KARPUZ' || t.product === 'KAVUN';
  
  if (isMelon && t.buyPrice > 2000) {
    // Ton transaction!
    const newQty = Math.round(t.qty * 1000 * 100) / 100;
    const newBuy = Math.round((t.buyPrice / 1000) * 100) / 100;
    const newSupply = Math.round((t.supplyPrice / 1000) * 100) / 100;
    
    convertedCount++;
    
    // Check for June 17 split case
    if (t.date === '2026-06-17' && t.product === 'KARPUZ' && t.hotel === 'MİRAMOR GARDEN' && Math.abs(newQty - 2030) < 5) {
      splitCount++;
      // Split into Miramor Garden (1050) and Grand Miramor (980)
      transformed.push({
        ...t,
        id: t.id, // Keep same ID or generate new?
        hotel: 'MİRAMOR GARDEN',
        qty: 1050,
        buyPrice: 10,
        supplyPrice: 22.5 // Will be recalculated
      });
      transformed.push({
        ...t,
        id: Date.now() + 1, // Generate unique ID
        hotel: 'GRAND MİRAMOR',
        qty: 980,
        buyPrice: 10,
        supplyPrice: 22.5
      });
    } else {
      transformed.push({
        ...t,
        qty: newQty,
        buyPrice: newBuy,
        supplyPrice: newSupply
      });
    }
  } else {
    transformed.push(t);
  }
});

console.log(`\nTransformation stats:`);
console.log(`  Total transactions before: ${txs.length}`);
console.log(`  Total transactions after:  ${transformed.length}`);
console.log(`  Converted from ton to kg:  ${convertedCount}`);
console.log(`  Split transactions:        ${splitCount}`);

console.log('\nConverted transactions samples:');
transformed.filter(t => (t.product === 'KARPUZ' || t.product === 'KAVUN') && ['2026-06-10', '2026-06-12', '2026-06-15', '2026-06-17'].includes(t.date)).forEach(t => {
  console.log(`  Date: ${t.date} | Hotel: ${t.hotel} | Product: ${t.product} | Qty: ${t.qty} kg | BuyPrice: ${t.buyPrice} | SupplyPrice: ${t.supplyPrice}`);
});
