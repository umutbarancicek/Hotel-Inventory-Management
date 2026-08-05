import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA1Iv_1fkFSVI-P4Y_g1QlCgB4CMsRZJFI",
  authDomain: "miramor-inventory-management.firebaseapp.com",
  projectId: "miramor-inventory-management",
  storageBucket: "miramor-inventory-management.firebasestorage.app",
  messagingSenderId: "539349013423",
  appId: "1:539349013423:web:53cb425931b51b1530d55a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

async function findMissingTuted() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const priceLists = data.priceLists || {};

  const missingList = [];

  transactions.forEach(t => {
    const list = priceLists[t.date] || [];
    const prodClean = (t.product || '').trim().toUpperCase();

    let pMatch = list.find(p => (p.product || '').trim().toUpperCase() === prodClean);
    if (!pMatch && list.length > 0) {
      pMatch = list.find(p => {
        const pName = (p.product || '').trim().toUpperCase();
        return pName.includes(prodClean) || prodClean.includes(pName);
      });
    }

    if (!pMatch) {
      const hasListForDate = list.length > 0;
      missingList.push({
        id: t.id,
        date: t.date,
        supplier: t.supplier,
        hotel: t.hotel,
        product: t.product,
        qty: t.qty,
        buyPrice: t.buyPrice,
        reason: hasListForDate ? 'Bu tarihte bülten var ama ürün bültende yok' : 'Bu tarihte hiç bülten yayınlanmamış'
      });
    }
  });

  console.log(`Total transactions checked: ${transactions.length}`);
  console.log(`Total missing TÜTED transactions: ${missingList.length}`);

  // Group by Date
  const byDate = {};
  missingList.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  });

  console.log('\n====================================================');
  console.log('      TÜTED FİYATI OLMAYAN TÜM İŞLEMLER LİSTESİ     ');
  console.log('====================================================\n');

  const datesSorted = Object.keys(byDate).sort();

  datesSorted.forEach(d => {
    console.log(`📅 TARİH: ${d} (${byDate[d].length} kalem işlem)`);
    byDate[d].forEach(item => {
      console.log(`   • Müstahsil: ${item.supplier.padEnd(20)} | Otel: ${item.hotel.padEnd(16)} | Ürün: ${item.product.padEnd(22)} | Miktar: ${String(item.qty).padStart(4)} | Alış Fiy: ₺${String(item.buyPrice).padStart(6)} | Neden: ${item.reason}`);
    });
    console.log('');
  });
}

findMissingTuted();
