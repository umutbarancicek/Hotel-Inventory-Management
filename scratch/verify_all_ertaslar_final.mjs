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

async function verifyFinal() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const ertaslarTx = data.transactions.filter(t => (t.supplier || '').trim().toUpperCase().includes('ERTAŞ') || (t.supplier || '').trim().toUpperCase().includes('ERTAS'));
  console.log(`Total ERTAŞLAR transactions: ${ertaslarTx.length}`);

  const countsByProduct = {};
  ertaslarTx.forEach(t => {
    countsByProduct[t.product] = (countsByProduct[t.product] || 0) + 1;
  });

  console.log('\nTop 25 Product Names in Ertaşlar now:');
  const sorted = Object.entries(countsByProduct).sort((a,b) => b[1] - a[1]);
  sorted.slice(0, 25).forEach(([prod, count]) => {
    console.log(`• ${prod}: ${count} adet`);
  });

  console.log('\nChecking formerly varied products:');
  console.log(`• DOMATES: ${countsByProduct['DOMATES'] || 0} (DOMATES CAM replaced)`);
  console.log(`• DOMATES CAM: ${countsByProduct['DOMATES CAM'] || 0}`);
  console.log(`• NANE: ${countsByProduct['NANE'] || 0} (NANE TAZE replaced)`);
  console.log(`• NANE TAZE: ${countsByProduct['NANE TAZE'] || 0}`);
  console.log(`• KABAK: ${countsByProduct['KABAK'] || 0} (KABAK TAZE replaced)`);
  console.log(`• KABAK TAZE: ${countsByProduct['KABAK TAZE'] || 0}`);
  console.log(`• HAVUÇ BEYPAZARI: ${countsByProduct['HAVUÇ BEYPAZARI'] || 0} (HAVUÇ replaced)`);
  console.log(`• HAVUÇ: ${countsByProduct['HAVUÇ'] || 0}`);
}

verifyFinal();
