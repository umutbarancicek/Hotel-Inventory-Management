import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

async function fixErtaslarSupplierNames() {
  console.log('=== UNIFYING ERTAŞLAR SUPPLIER NAMES IN DB (MSD07 TAR ÜR -> ERTAŞLAR) ===');
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const transactions = data.transactions || [];
  let updatedCount = 0;

  transactions.forEach(t => {
    if (t.supplier === 'MSD07 TAR ÜR' || t.supplier === 'MSD07' || t.supplier === 'Ertaşlar Global Sebze  Meyve TarimTicaret Ltd.Şti.') {
      t.supplier = 'ERTAŞLAR';
      updatedCount++;
    }
  });

  console.log(`Updated ${updatedCount} transactions supplier name to "ERTAŞLAR".`);

  await updateDoc(docRef, {
    transactions: transactions
  });

  console.log('✅ All Ertaşlar transactions successfully unified under "ERTAŞLAR" supplier name!');
}

fixErtaslarSupplierNames().catch(console.error);
