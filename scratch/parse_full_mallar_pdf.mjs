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

async function parseFullMallarPdf() {
  console.log('=== PARSING ALL PAGES OF C:\\Users\\Baran\\Desktop\\mallar.pdf ===');
  const pdfPath = 'C:\\Users\\Baran\\Desktop\\mallar.pdf';
  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse(new Uint8Array(dataBuffer));
  const pdfData = await parser.getText();

  console.log(`Total Text Length: ${pdfData.text.length} chars.`);
  const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);

  console.log(`Non-empty lines count: ${lines.length}`);
  console.log('\nSample PDF Lines (20 to 60):');
  lines.slice(20, 60).forEach((l, i) => console.log(`${i+21}: ${l}`));
}

parseFullMallarPdf().catch(console.error);
