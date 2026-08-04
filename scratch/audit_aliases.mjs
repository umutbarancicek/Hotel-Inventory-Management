import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

const productAliases = {
  'ADAÇAYI TAZE': ['ADAÇAYI', 'ADAÇAYI TAZE'],
  'ARMUT': ['ARMUT SANDAMARİA', 'ARMUT'],
  'BİBER DOLMALIK YEŞİL': ['BİBER DOLMA', 'BİBER DOLMALIK YEŞİL'],
  'BİBER KALİFORNİYA': ['BİBER KALİFORNİYA'],
  'BİBER KAPYA': ['BİBER KAPYA'],
  'BİBER KIL SİVRİ': ['BİBER KIL SİVRİ', 'BİBER SİVRİ'],
  'BİBER SİVRİ': ['BİBER SİVRİ'],
  'BİBER ÇARLİSTON': ['BİBER ÇARLİSTON'],
  'BİBERİYE ROSEMARY PAKET': ['ROZMARİN', 'BİBERİYE'],
  'DEREOTU': ['DEREOTU'],
  'DOMATES BEEF': ['DOMATES BEEF'],
  'DOMATES CAM': ['DOMATES'],
  'DOMATES KOKTEYL': ['DOMATES KOKTEYL', 'DOMATES KOKTEL'],
  'DOMATES ÇERİ': ['DOMATES CHERRY', 'DOMATES CHERRY PAKET', 'DOMATES CHERY'],
  'ELMA GOLDEN': ['ELMA GOLDEN'],
  'ELMA GRANNY SMİTH': ['ELMA GRANSİMİT', 'ELMA GREEN', 'ELMA GRANNY SMİTH'],
  'ELMA KIRMIZI': ['ELMA STARKING', 'ELMA KIRMIZI'],
  'ERİK ANJELİKA': ['ERİK ANJELİKA', 'ERİK'],
  'FESLEĞEN': ['FESLEĞEN', 'FESLEĞEN PAKET'],
  'GREYFURT': ['GREYFURT'],
  'HAVUÇ': ['HAVUÇ BEYPAZARI', 'HAVUÇ'],
  'HAVUÇ MİNİ': ['HAVUÇ MİNİ'],
  'ISPANAK TAZE': ['ISPANAK'],
  'KABAK BAL': ['KABAK BAL DEKORLUK', 'KABAK BAL'],
  'KABAK DEKORLUK': ['KABAK BAL DEKORLUK', 'KABAK DEKORLUK'],
  'KABAK MİNİ': ['KABAK MİNİ', 'KABAK SAKIZ'],
  'KABAK SİYAH': ['KABAK SAKIZ'],
  'KABAK TAZE': ['KABAK SAKIZ', 'KABAK TAZE'],
  'KARNABAHAR': ['KARNABAHAR'],
  'KARPUZ': ['KARPUZ'],
  'KAYISI': ['KAYISI'],
  'KEKİK TAZE': ['KEKİK TAZE'],
  'KEREVİZ': ['KEREVİZ'],
  'KUZU KULAĞI': ['KUZU KULAĞI', 'KUZU KULAGI PAKET'],
  'KİRAZ': ['KİRAZ'],
  'LAHANA BEYAZ': ['LAHANA BEYAZ'],
  'LAHANA KIRMIZI': ['LAHANA KIRMIZI'],
  'LİMON': ['LİMON'],
  'MANDALİNA': ['MANDALİNA PAKET', 'MANDALİNA'],
  'MARUL AYSBERG': ['MARUL ICEBERG', 'MARUL AYSBERG', 'AYSBERG'],
  'MARUL DÜZ': ['MARUL DÜZ'],
  'MARUL KIRMIZI YAPRAK': ['KIRMIZI YAPRAK', 'MARUL KIRMIZI YAPRAK'],
  'MARUL KIVIRCIK': ['MARUL KIVIRCIK'],
  'MARUL LOLO ROSSO KIRMIZI': ['LOLOROSSO', 'MARUL LOLO ROSSO'],
  'MARUL POLOROSSO': ['POLOROSSO'],
  'MAYDANOZ': ['MAYDONOZ', 'MAYDANOZ'],
  'MAYDANOZ FRENK': ['MAYDONOZ FRENK', 'MAYDANOZ FRENK'],
  'MUZ YERLİ': ['MUZ YERLİ'],
  'NANE TAZE': ['NANE'],
  'NEKTARİN': ['NEKTARİN'],
  'PANCAR KIRMIZI': ['PANCAR KIRMIZI'],
  'PATATES': ['PATATES TAZE', 'PATATES'],
  'PATATES BABY': ['PATATES BABY'],
  'PATATES KUMPİR': ['PATATES KUMPİR'],
  'PATLICAN': ['PATLICAN'],
  'PATLICAN BOSTAN': ['PATLICAN BOSTAN'],
  'PAZI': ['PAZI YAPRAGI', 'PAZI'],
  'PIRASA': ['PIRASA'],
  'PORTAKAL MEYVELİK': ['PORTAKAL MEYVELİK PAKET', 'PORTAKAL MEYVELİK'],
  'PORTAKAL SIKMALIK': ['PORTAKAL SIKMALIK'],
  'ROKA': ['ROKA'],
  'SALATALIK': ['HIYAR YAYLA', 'SALATALIK'],
  'SALATALIK SLOR': ['SALATALIK SİLOR PAKET', 'SALATALIK SİLOR'],
  'SARIMSAK KURU': ['SARIMSAK KURU'],
  'SARIMSAK İTHAL': ['SARIMSAK İTHAL'],
  'SEMİZOTU': ['SEMİZOTU'],
  'SOĞAN FRENK': ['ŞİNİKLAV', 'SOĞAN FRENK'],
  'SOĞAN KIRMIZI': ['SOĞAN KIRMIZI'],
  'SOĞAN KURU': ['SOĞAN KURU'],
  'SOĞAN TAZE': ['SOĞAN TAZE'],
  'TERE': ['TERE'],
  'TERE SU': ['TERE SU'],
  'TURP': ['TURP KIRMIZI', 'TURP'],
  'TURP JAPON': ['TURP JAPON'],
  'YABAN MERSİNİ': ['BLUE BERRY', 'YABAN MERSİNİ'],
  'YENİ DÜNYA-MALTA ERİĞİ': ['YENİ DÜNYA', 'MALTA ERİĞİ'],
  'ÇİLEK': ['ÇİLEK'],
  'ŞEFTALİ': ['ŞEFTALİ'],
};

async function auditWithAliases() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();
  const ertaslarTx = data.transactions.filter(t => t.supplier === 'ERTAŞLAR');

  let exactMatchCount = 0;
  let aliasMatchCount = 0;
  let unmappedCount = 0;
  const unmappedSet = new Set();

  ertaslarTx.forEach(tx => {
    const list = data.priceLists ? data.priceLists[tx.date] : null;
    if (!list) { unmappedCount++; unmappedSet.add(`No priceList for ${tx.date}`); return; }

    const txProd = (tx.product||'').trim().toUpperCase();
    const exact = list.find(p => p.product.trim().toUpperCase() === txProd);
    if (exact) {
      exactMatchCount++;
      return;
    }

    // Alias
    const aliases = productAliases[txProd] || [];
    let aliasFound = null;
    for (const a of aliases) {
      aliasFound = list.find(p => p.product.trim().toUpperCase() === a);
      if (aliasFound) break;
    }

    if (aliasFound) {
      aliasMatchCount++;
    } else {
      unmappedCount++;
      unmappedSet.add(`${tx.date} | ${tx.product}`);
    }
  });

  console.log(`Total Ertaşlar Transactions: ${ertaslarTx.length}`);
  console.log(`Exact Product Name Match: ${exactMatchCount}`);
  console.log(`Alias Matched (MAYDONOZ -> MAYDANOZ, KABAK SAKIZ -> KABAK TAZE): ${aliasMatchCount}`);
  console.log(`Unmapped: ${unmappedCount}`);
  if (unmappedSet.size > 0) {
    console.log('\nUnmapped list:');
    [...unmappedSet].forEach(u => console.log(`  ${u}`));
  }
}

auditWithAliases().catch(err => console.error(err));
