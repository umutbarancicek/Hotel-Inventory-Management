import fs from 'fs';
import * as XLSX from 'xlsx';
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

async function importOnlyMallarPdfExcel() {
  console.log('=== IMPORTING ONLY AND EXACTLY MALLAR.PDF (PIVOT SEVK RAPORU EXCEL) ===');
  const excelPath = "C:\\Users\\Baran\\Downloads\\pivot_sevk_raporu_2026-08-04 (2).xlsx";
  if (!fs.existsSync(excelPath)) {
    console.error('Excel report file not found!');
    return;
  }

  const buf = fs.readFileSync(excelPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Pivot Raporu'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

  const dataRows = rows.slice(1).filter(r => r[0] && r[1] && r[2] && r[3] && r[4] !== undefined);

  console.log(`Parsed ${dataRows.length} valid rows from mallar.pdf Excel version.`);

  const mallarTransactions = [];
  dataRows.forEach((r, idx) => {
    const supplier = String(r[0]).trim();
    const isoDate = parseReportDate(r[1]);
    const prod = String(r[2]).trim();
    const hotel = String(r[3]).trim();
    const qty = parseFloat(String(r[4]).replace(/\./g, '').replace(',', '.')) || 0;
    const halTutar = parseCurrencyStr(r[5]);
    const tedarikTutar = parseCurrencyStr(r[6]);

    const buyPrice = qty > 0 ? Math.round((halTutar / qty) * 100) / 100 : 0;
    const supplyPrice = qty > 0 ? Math.round((tedarikTutar / qty) * 100) / 100 : buyPrice;

    mallarTransactions.push({
      id: 1785800000000 + idx,
      date: isoDate,
      supplier: supplier,
      hotel: hotel,
      product: prod,
      qty: qty,
      buyPrice: buyPrice,
      supplyPrice: supplyPrice
    });
  });

  let totalHal = 0;
  let totalTed = 0;
  let totalKg = 0;

  mallarTransactions.forEach(t => {
    totalKg += t.qty;
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\n=== MALLAR.PDF EXCLUSIVELY MATCHED TOTALS ===`);
  console.log(`Total Transactions: ${mallarTransactions.length}`);
  console.log(`Total Kg: ${totalKg.toLocaleString('tr-TR')} kg`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark (Kar): ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  const docRef = doc(db, 'storage', 'appData');
  await updateDoc(docRef, {
    transactions: mallarTransactions
  });

  console.log('✅ Firebase successfully updated to contain ONLY AND EXACTLY mallar.pdf data!');
}

importOnlyMallarPdfExcel().catch(console.error);
