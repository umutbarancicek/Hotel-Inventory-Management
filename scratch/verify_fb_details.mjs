import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

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

async function checkFirebaseRecords() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const ertaslarTx = data.transactions.filter(t => t.supplier === 'ERTAŞLAR');
  console.log(`Total ERTAŞLAR records: ${ertaslarTx.length}`);

  // Let's print records for 30.04.2026 for GRAND MİRAMOR
  const sample = ertaslarTx.filter(t => t.date === '2026-04-30' && t.hotel === 'GRAND MİRAMOR');
  console.log(`\nSample records for GRAND MİRAMOR on 2026-04-30 (${sample.length} items):`);
  
  sample.forEach((t, i) => {
    console.log(`  ${i+1}. Mal: "${t.product}" | Kilo: ${t.qty} | Alış F.: ${t.buyPrice} TL | Teda F.: ${t.supplyPrice} TL`);
  });

  // Check stored priceLists in Firebase for 2026-04-30
  console.log('\nStored priceList for 2026-04-30 in Firebase:');
  const list30 = data.priceLists ? data.priceLists['2026-04-30'] : null;
  if (list30) {
    console.log(`  Contains ${list30.length} items. Sample items:`);
    list30.slice(0, 10).forEach(p => console.log(`    ${p.product}: price=${p.price}`));
  } else {
    console.log('  NONE!');
  }
}

checkFirebaseRecords();
