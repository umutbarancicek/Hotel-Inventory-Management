import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import * as XLSX from 'xlsx';

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

function parseExcelDate(val) {
  if (typeof val === 'number') {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (str.includes('.')) {
    const [d, m, y] = str.split('.');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return str;
}

async function main() {
  const xlsmPath = "C:\\Users\\Baran\\Desktop\\otel yedek.xlsm";
  const buf = fs.readFileSync(xlsmPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const wsVeri = wb.Sheets['VERİ'];
  const rows = XLSX.utils.sheet_to_json(wsVeri, { header: 1, raw: true });

  const excelDates = new Set();
  rows.slice(2).forEach(r => {
    if (r[1] !== undefined) excelDates.add(parseExcelDate(r[1]));
  });

  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const dbTxs = docSnap.data().transactions || [];
  const dbDates = new Set(dbTxs.map(t => t.date));

  const sortedExcelDates = [...excelDates].filter(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const sortedDbDates = [...dbDates].filter(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();

  console.log(`Excel dates count: ${sortedExcelDates.length}`);
  console.log(`Excel range: ${sortedExcelDates[0]} to ${sortedExcelDates[sortedExcelDates.length-1]}`);

  console.log(`\nDB dates count: ${sortedDbDates.length}`);
  console.log(`DB range: ${sortedDbDates[0]} to ${sortedDbDates[sortedDbDates.length-1]}`);
}

main().catch(console.error);
