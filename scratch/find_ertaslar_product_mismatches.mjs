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

function cleanStr(str) {
  if (!str) return '';
  return str.toString().trim().toUpperCase()
    .replace(/İ/g, 'I').replace(/I/g, 'I').replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
}

async function analyzeProducts() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const ertaslarTx = data.transactions.filter(t => (t.supplier||'').trim().toUpperCase().includes('ERTAŞ') || (t.supplier||'').trim().toUpperCase().includes('ERTAS'));
  console.log(`Total ERTAŞLAR transactions: ${ertaslarTx.length}`);

  const priceLists = data.priceLists || {};
  
  // Get all unique product names in Ertaşlar
  const productStats = {};
  
  ertaslarTx.forEach(t => {
    const prod = (t.product || '').trim();
    if (!productStats[prod]) {
      productStats[prod] = {
        name: prod,
        count: 0,
        dates: new Set(),
        exactMatchTutedCount: 0,
        fuzzyMatchTutedCount: 0,
        noMatchTutedCount: 0,
        tutedMatches: new Set()
      };
    }
    const stat = productStats[prod];
    stat.count++;
    stat.dates.add(t.date);

    const priceList = priceLists[t.date] || [];
    const prodClean = cleanStr(prod);
    
    // Find exact or partial match in TÜTED for that date
    let exact = priceList.find(p => cleanStr(p.product) === prodClean);
    if (exact) {
      stat.exactMatchTutedCount++;
      stat.tutedMatches.add(exact.product);
    } else {
      let partial = priceList.find(p => {
        const c = cleanStr(p.product);
        return c.includes(prodClean) || prodClean.includes(c);
      });
      if (partial) {
        stat.fuzzyMatchTutedCount++;
        stat.tutedMatches.add(partial.product);
      } else {
        stat.noMatchTutedCount++;
      }
    }
  });

  const sortedProds = Object.values(productStats).sort((a, b) => b.count - a.count);

  console.log('\n========================================');
  console.log('ERTAŞLAR ÜRÜN İSİMLERİ VE TÜTED EŞLEŞME ANALİZİ');
  console.log('========================================\n');

  console.log('1. TÜTED İLE BİREBİR EŞLEŞMEYEN / CAM-SERA / EKLİ İSİMLER:');
  console.log('---------------------------------------------------------');
  
  const mismatches = [];

  sortedProds.forEach(stat => {
    const tutedList = Array.from(stat.tutedMatches).join(', ');
    const isExactAll = stat.exactMatchTutedCount === stat.count;
    
    if (!isExactAll) {
      mismatches.push({
        name: stat.name,
        count: stat.count,
        exact: stat.exactMatchTutedCount,
        fuzzy: stat.fuzzyMatchTutedCount,
        noMatch: stat.noMatchTutedCount,
        tutedMatches: tutedList
      });
    }
  });

  console.table(mismatches.map(m => ({
    'Excel/İşlem Adı': m.name,
    'Kayıt Sayısı': m.count,
    'Tam Eşleşen': m.exact,
    'Kısmi Eşleşen': m.fuzzy,
    'Hiç Bulunamayan': m.noMatch,
    'TÜTED Borsa Karşılığı': m.tutedMatches || '—'
  })));

  // Group by base word (e.g. DOMATES, BİBER, PATATES, vs.)
  const groups = {};
  sortedProds.forEach(stat => {
    const firstWord = stat.name.split(' ')[0].toUpperCase();
    if (!groups[firstWord]) groups[firstWord] = [];
    groups[firstWord].push(stat);
  });

  console.log('\n2. BENZER/ÇEŞİTLİ İSİMLERİN GRUPLAMASI (Örn: Domates vs Domates Cam):');
  console.log('------------------------------------------------------------------');
  Object.keys(groups).sort().forEach(groupKey => {
    if (groups[groupKey].length > 1) {
      console.log(`\n📦 Grubu: [${groupKey}] (${groups[groupKey].length} farklı isim):`);
      groups[groupKey].forEach(item => {
        console.log(`   • ${item.name} (${item.count} adet) -> TÜTED Karşılığı: [${Array.from(item.tutedMatches).join(', ') || 'Yok'}]`);
      });
    }
  });
}

analyzeProducts();
