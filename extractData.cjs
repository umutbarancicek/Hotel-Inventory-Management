const xlsx = require('xlsx');
const fs = require('fs');

const filePath = 'C:\\Users\\Baran\\Desktop\\otel yedek.xlsm';
const outputPath = 'C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\initialData.js';

try {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    
    const data = {
        transactions: [],
        payments: [],
        prices: [],
        accounts: []
    };
    
    const suppliers = new Set();
    const hotels = new Set();
    
    const parseNum = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const s = val.toString().trim();
        if (s === '') return 0;
        return Number(s.replace(/[^0-9,-]+/g,"").replace(',', '.'));
    };

    const formatDate = (val) => {
        if (!val) return '';
        if (val instanceof Date) {
            return val.toISOString().split('T')[0];
        }
        return val.toString();
    };

    // 1. Process VERİ
    if (workbook.Sheets['VERİ']) {
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets['VERİ'], { header: 1 });
        rows.forEach((row, index) => {
            // Skip headers or summary rows
            // 0: MÜSTAHSİL, 1: TARİH, 2: MAL, 3: KİLO, 4: GİTTİĞİ YER, 5: TÜTED, 6: ALIŞ FİAT, 7: TEDA FİAT
            if (index > 0 && row.length >= 8) {
                const supplier = row[0];
                const date = row[1];
                const product = row[2];
                const qty = parseNum(row[3]);
                const hotel = row[4];
                const buyPrice = parseNum(row[6]);
                const supplyPrice = parseNum(row[7]);
                
                if (supplier && typeof supplier === 'string' && supplier !== 'MÜSTAHSİL' && hotel && typeof hotel === 'string' && qty > 0) {
                    suppliers.add(supplier.trim());
                    hotels.add(hotel.trim());
                    
                    data.transactions.push({
                        id: index,
                        date: formatDate(date),
                        supplier: supplier.trim(),
                        hotel: hotel.trim(),
                        product: product ? product.toString().trim() : '',
                        qty: qty,
                        buyPrice: buyPrice,
                        supplyPrice: supplyPrice
                    });
                }
            }
        });
    }
    
    // 2. Process ÖDEMELER
    if (workbook.Sheets['ÖDEMELER']) {
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets['ÖDEMELER'], { header: 1 });
        rows.forEach((row, index) => {
            // 0: TARİH, 1: CARİ ADI, 2: ÖDEME TUTARI, 3: AÇIKLAMA
            if (index > 0 && row.length >= 3) {
                const date = row[0];
                const account = row[1];
                const amount = parseNum(row[2]);
                const desc = row[3] || '';
                
                if (account && typeof account === 'string' && account !== 'CARİ ADI' && amount > 0) {
                    const accName = account.trim();
                    if (!suppliers.has(accName) && !hotels.has(accName)) {
                        if (accName.includes('HAL') || accName.includes('ÜRETİCİ')) {
                            suppliers.add(accName);
                        } else {
                            hotels.add(accName);
                        }
                    }
                    
                    data.payments.push({
                        id: index,
                        date: formatDate(date),
                        account: accName,
                        amount: amount,
                        description: desc.toString()
                    });
                }
            }
        });
    }
    
    // 3. Process FİYAT LİSTESİ
    if (workbook.Sheets['FİYAT LİSTESİ']) {
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets['FİYAT LİSTESİ'], { header: 1 });
        rows.forEach((row, index) => {
            if (index > 0 && row.length >= 4) {
                const product = row[1];
                const unit = row[2];
                const price = parseNum(row[3]);
                
                if (product && typeof product === 'string' && unit && price > 0) {
                    data.prices.push({
                        id: index,
                        product: product.trim(),
                        unit: unit.toString().trim(),
                        price: price
                    });
                }
            }
        });
        
        const uniquePrices = [];
        const seenProd = new Set();
        data.prices.forEach(p => {
            if (!seenProd.has(p.product)) {
                seenProd.add(p.product);
                uniquePrices.push(p);
            }
        });
        data.prices = uniquePrices;
    }
    
    // Combine accounts
    suppliers.forEach(s => data.accounts.push({ type: 'supplier', name: s }));
    hotels.forEach(h => data.accounts.push({ type: 'hotel', name: h }));
    
    const jsContent = `export const INITIAL_DATA = ${JSON.stringify(data, null, 2)};`;
    fs.writeFileSync(outputPath, jsContent, 'utf-8');
    
    console.log('Extraction complete. Wrote to initialData.js');
    console.log(`Transactions: ${data.transactions.length}`);
    console.log(`Payments: ${data.payments.length}`);
    console.log(`Prices: ${data.prices.length}`);
    console.log(`Accounts: ${data.accounts.length}`);
    
} catch (e) {
    console.error('Error:', e);
}
