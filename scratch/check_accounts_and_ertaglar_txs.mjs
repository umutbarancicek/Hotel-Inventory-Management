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

function cleanStr(str) {
  return (str || '').toString().trim().toUpperCase()
    .replace(/İ/g, 'I').replace(/I/g, 'I')
    .replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S').replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C').replace(/\s+/g, ' ');
}

async function checkAccountsAndErtaslarTxs() {
  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const txs = data.transactions || [];
  const accounts = data.accounts || [];

  console.log('--- ALL ACCOUNTS IN DB ---');
  accounts.forEach(a => console.log(`[${a.type}] ${a.name}`));

  const supplierNamesInTxs = [...new Set(txs.map(t => t.supplier))];
  console.log('\n--- ALL SUPPLIER NAMES IN TRANSACTIONS ---');
  supplierNamesInTxs.forEach(s => {
    const count = txs.filter(t => t.supplier === s).length;
    console.log(`Supplier: "${s}" -> ${count} transactions`);
  });
}

checkAccountsAndErtaslarTxs().catch(console.error);
