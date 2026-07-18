const fs = require('fs');

const jsPath = 'C:/Users/Baran/Documents/GitHub/Hotel-Inventory-Management/main.js';
let content = fs.readFileSync(jsPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update selectedRows calculation in renderVeri
const oldSelectedRowsBlock = `    const pMatch = datePriceList.find(dp => (dp.product||'').trim() === (p.product||'').trim());
    const tutedVal = pMatch ? parsePrice(pMatch.price) : parsePrice(p.price);
    const tutedStr = tutedVal > 0 ? formatCurrency(tutedVal) : '—';
    
    const numKilo = parseFloat(String(kilo).replace(',','.')) || 0;
    const numBuy = parseFloat(String(buyVal).replace(',','.')) || 0;
    const numSupply = parseFloat(String(supplyVal).replace(',','.')) || 0;`;

const newSelectedRowsBlock = `    const pMatch = datePriceList.find(dp => (dp.product||'').trim() === (p.product||'').trim());
    const tutedVal = pMatch ? parsePrice(pMatch.price) : parsePrice(p.price);
    const tutedStr = tutedVal > 0 ? formatCurrency(tutedVal) : '—';
    
    // Auto calculate Tedarik Fiyatı based on Hotel (Sephoria & Casafora = 22%, Others = 18%)
    const hUpper = (qeState.hotel || '').toUpperCase().trim();
    const isSpecialHotel = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA');
    const marginRate = isSpecialHotel ? 1.22 : 1.18;
    
    let defaultSupply = '';
    if (tutedVal > 0) {
      defaultSupply = (Math.round(tutedVal * marginRate * 100) / 100).toString();
    }
    
    const finalSupplyVal = ov.supply !== undefined ? ov.supply : defaultSupply;
    const supplyVal = finalSupplyVal;
    
    const numKilo = parseFloat(String(kilo).replace(',','.')) || 0;
    const numBuy = parseFloat(String(buyVal).replace(',','.')) || 0;
    const numSupply = parseFloat(String(supplyVal).replace(',','.')) || 0;`;

if (content.includes(oldSelectedRowsBlock)) {
  content = content.replace(oldSelectedRowsBlock, newSelectedRowsBlock);
  console.log('Updated selectedRows supplyVal calculation in main.js!');
} else {
  console.error('Could not find oldSelectedRowsBlock in main.js!');
}

// 2. Update qeSave logic to use auto supply price if not overridden
const oldQeSaveBlock = `    const buyPrice = ov.buy !== undefined ? ov.buy : 0;
    const supplyPrice = ov.supply !== undefined ? ov.supply : 0;`;

const newQeSaveBlock = `    const buyPrice = ov.buy !== undefined ? ov.buy : 0;
    
    let supplyPrice = ov.supply !== undefined ? ov.supply : 0;
    if (ov.supply === undefined) {
      const datePriceList = getPriceListForDate(qeState.date);
      const pMatch = datePriceList.find(dp => (dp.product||'').trim() === product.trim());
      const tutedVal = pMatch ? parsePrice(pMatch.price) : 0;
      if (tutedVal > 0) {
        const hUpper = (qeState.hotel || '').toUpperCase().trim();
        const isSpecial = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA');
        const rate = isSpecial ? 1.22 : 1.18;
        supplyPrice = Math.round(tutedVal * rate * 100) / 100;
      }
    }`;

if (content.includes(oldQeSaveBlock)) {
  content = content.replace(oldQeSaveBlock, newQeSaveBlock);
  console.log('Updated qeSave supplyPrice calculation in main.js!');
} else {
  console.error('Could not find oldQeSaveBlock in main.js!');
}

fs.writeFileSync(jsPath, content);
console.log('Successfully applied hotel supply price margin rules to main.js!');
