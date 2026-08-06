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

const depoToHotel = {
  'Ambassador Ana Depo': 'AMBASSADOR',
  'Astoria Ana Depo': 'ASTORİA',
  'Grand Miramor Ana Depo': 'GRAND MİRAMOR',
  'Miramor Garden Ana Depo': 'MİRAMOR GARDEN',
  'Seaphoria Ana Depo': 'SEAPHORİA',
  'Stella Ana Depo': 'STELLA',
};

async function restoreOriginalData() {
  console.log('=== RESTORING ORIGINAL EXCEL TRANSACTIONS TO FIREBASE ===');
  const excelPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
  if (!fs.existsSync(excelPath)) {
    console.error('Excel file not found!');
    return;
  }

  const buf = fs.readFileSync(excelPath);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets['Sheet'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'YYYY-MM-DD' });

  const rawData = rows.slice(1).filter(r => r[0] && r[1] && r[4] !== undefined && r[4] !== null);

  console.log(`Loaded ${rawData.length} valid rows from Ertaşlar Excel.`);

  const docRef = doc(db, 'storage', 'appData');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const currentTxs = data.transactions || [];
  const nonErtaslarTxs = currentTxs.filter(t => (t.supplier || '').trim().toUpperCase() !== 'ERTAŞLAR');

  const restoredErtaslarTxs = [];
  rawData.forEach((row, idx) => {
    let dateStr = String(row[0]).trim();
    let isoDate = '';
    if (dateStr.includes('.')) {
      const [d, m, y] = dateStr.split('.');
      isoDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    } else if (dateStr.includes('-')) {
      isoDate = dateStr;
    } else {
      isoDate = '2026-08-04';
    }

    const depo = (row[1] || '').toString().trim();
    const hotel = depoToHotel[depo] || depo;
    const prod = (row[2] || '').toString().trim();
    const qty = parseFloat(row[3]) || 0;
    const buyPrice = parseFloat(String(row[4]).replace(',', '.')) || 0;
    const supplyPrice = (row[5] !== undefined && row[5] !== null) ? (parseFloat(String(row[5]).replace(',', '.')) || buyPrice) : buyPrice;

    restoredErtaslarTxs.push({
      id: 1785700000000 + idx,
      date: isoDate,
      supplier: 'ERTAŞLAR',
      hotel: hotel,
      product: prod,
      qty: qty,
      buyPrice: buyPrice,
      supplyPrice: supplyPrice
    });
  });

  const finalTransactions = [...nonErtaslarTxs, ...restoredErtaslarTxs];

  let totalHal = 0;
  let totalTed = 0;
  finalTransactions.forEach(t => {
    totalHal += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    totalTed += t.qty * eff;
  });

  console.log(`\nRestored System Totals:`);
  console.log(`Total Transactions: ${finalTransactions.length}`);
  console.log(`Total Hal Alış: ₺${totalHal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Otel Tedarik: ₺${totalTed.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Total Net Fark: ₺${(totalTed - totalHal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);

  await updateDoc(docRef, {
    transactions: finalTransactions
  });

  console.log('✅ Firebase transactions successfully restored to original Excel state!');
}

restoreOriginalData().catch(console.error);
