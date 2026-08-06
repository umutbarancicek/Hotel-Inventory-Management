import fs from 'fs';
import * as XLSX from 'xlsx';
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

function parseCurrencyStr(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let clean = String(str).replace(/[^\d\,\-]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

function parseReportDate(val) {
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
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      let d = parts[0].padStart(2, '0');
      let m = parts[1].padStart(2, '0');
      let y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  return str;
}

async function findDifferingRows() {
  const excelPath = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (2).xlsx";
  const buf = fs.readFileSync(excelPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Pivot Raporu'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

  const dataRows = rows.slice(1).filter(r => r[0] && r[1] && r[2] && r[3] && r[4] !== undefined);

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  const dbTxs = data.transactions || [];

  console.log(`Analyzing ${dataRows.length} Excel rows vs ${dbTxs.length} DB transactions...`);

  const diffList = [];

  dataRows.forEach((r, idx) => {
    const supplier = String(r[0]).trim();
    const isoDate = parseReportDate(r[1]);
    const prod = String(r[2]).trim();
    const hotel = String(r[3]).trim();
    const qty = parseFloat(String(r[4]).replace(/\./g, '').replace(',', '.')) || 0;
    const excelHalTutar = parseCurrencyStr(r[5]);
    const excelTedTutar = parseCurrencyStr(r[6]);

    const dbMatch = dbTxs.find(t => t.date === isoDate && t.supplier === supplier && t.hotel === hotel && t.product === prod && Math.abs(t.qty - qty) < 0.1);

    if (dbMatch) {
      const dbTedTutar = dbMatch.qty * dbMatch.supplyPrice;
      const diff = Math.abs(excelTedTutar - dbTedTutar);
      if (diff > 1.0) {
        diffList.push({
          date: isoDate,
          supplier,
          product: prod,
          hotel,
          qty,
          excelTedTutar,
          dbSupplyPrice: dbMatch.supplyPrice,
          dbTedTutar,
          diff
        });
      }
    }
  });

  diffList.sort((a, b) => b.diff - a.diff);

  console.log(`\nFound ${diffList.length} rows with Tedarik Tutarı difference > 1.00 TL:`);
  diffList.slice(0, 15).forEach((d, i) => {
    console.log(`${i+1}. ${d.date} | ${d.supplier} | ${d.product} | ${d.hotel} | Qty: ${d.qty} | Excel Ted: ₺${d.excelTedTutar.toFixed(2)} | DB Ted: ₺${d.dbTedTutar.toFixed(2)} | Diff: ₺${d.diff.toFixed(2)}`);
  });
}

findDifferingRows().catch(console.error);
