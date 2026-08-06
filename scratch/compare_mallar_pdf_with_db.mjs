import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
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

async function compareMallarPdfWithDb() {
  console.log('=== COMPARING C:\\Users\\Baran\\Desktop\\mallar.pdf WITH DATABASE ===');
  const pdfPath = 'C:\\Users\\Baran\\Desktop\\mallar.pdf';
  if (!fs.existsSync(pdfPath)) {
    console.error('mallar.pdf file not found!');
    return;
  }

  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const pdfData = await parser.getText();

  console.log(`PDF Total Text Length: ${pdfData.text.length} chars.`);
  const pdfLines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);

  console.log(`Sample PDF Lines (1 to 20):`);
  pdfLines.slice(0, 20).forEach((l, i) => console.log(`Line ${i+1}: ${l}`));

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const dbData = docSnap.data();

  const dbTransactions = dbData.transactions || [];
  console.log(`\nTotal DB Transactions: ${dbTransactions.length}`);
}

compareMallarPdfWithDb().catch(console.error);
