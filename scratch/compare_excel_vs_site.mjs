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

function parseNumExact(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim();
  if (!str) return 0;
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  return parseFloat(str) || 0;
}

function excelDateToIso(excelVal) {
  if (!excelVal) return '';
  if (typeof excelVal === 'number') {
    const dateObj = XLSX.SSF.parse_date_code(excelVal);
    const y = dateObj.y;
    const m = String(dateObj.m).padStart(2, '0');
    const d = String(dateObj.d).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(excelVal).trim();
  if (str.includes('.')) {
    const [d, m, y] = str.split('.');
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  return str;
}

async function compareExcelWithSite() {
  console.log('--- EXCEL FILE ANALYSIS ---');
  const excelPath = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";
  const excelBuf = fs.readFileSync(excelPath);
  const wb = XLSX.read(excelBuf, { type: 'buffer', raw: true });
  
  console.log('Sheet names:', wb.SheetNames);
  
  let allExcelRows = [];
  wb.SheetNames.forEach(sheetName => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true });
    console.log(`Sheet "${sheetName}" total raw rows: ${rows.length}`);
    if (rows.length > 0) {
      console.log(`Sheet "${sheetName}" Header row (Row 0):`, rows[0]);
      console.log(`Sheet "${sheetName}" Sample row 1:`, rows[1]);
    }
  });

  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
  
  // Header is row 0: Tarih, Malın Adı, Birim, Miktar, Birim Fiyat, Tutar, Müstahsil, vb.
  const dataRows = rawRows.slice(1).filter(r => r && r[0] !== undefined && r[1] !== undefined);
  console.log(`Valid data rows in primary sheet: ${dataRows.length}`);

  let excelTotalAlisTutar = 0;
  const excelBySupplier = {};
  const excelByHotel = {};
  const excelByMonth = {};

  dataRows.forEach((r, idx) => {
    const isoDate = excelDateToIso(r[0]);
    const prod = String(r[1] || '').trim();
    const qty = parseNumExact(r[3]);
    const buyPrice = parseNumExact(r[4]);
    // Calculated Tutar or Column 5 (Tutar)
    const tutarCol = r[5] !== undefined ? parseNumExact(r[5]) : (qty * buyPrice);
    const lineTutar = qty * buyPrice;
    
    excelTotalAlisTutar += lineTutar;

    const supplier = String(r[6] || r[7] || 'ERTAŞLAR').trim();
    const hotel = String(r[8] || r[9] || 'Bilinmiyor').trim();
    const month = isoDate ? isoDate.substring(0, 7) : 'Unknown';

    excelBySupplier[supplier] = (excelBySupplier[supplier] || 0) + lineTutar;
    excelByHotel[hotel] = (excelByHotel[hotel] || 0) + lineTutar;
    excelByMonth[month] = (excelByMonth[month] || 0) + lineTutar;
  });

  console.log(`\n=== EXCEL SUMMARY ===`);
  console.log(`Total Rows: ${dataRows.length}`);
  console.log(`Total Alış Tutarı (∑ Qty * BuyPrice): ₺${excelTotalAlisTutar.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log('Excel Totals by Month:', excelByMonth);
  console.log('Excel Totals by Supplier column:', excelBySupplier);
  console.log('Excel Totals by Hotel/Depo column:', excelByHotel);

  console.log('\n--- FIREBASE / SITE DATA ANALYSIS ---');
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const fbData = docSnap.data();
  const siteTxs = fbData.transactions || [];

  console.log(`Total transactions on site: ${siteTxs.length}`);

  const siteErtaşlarTxs = siteTxs.filter(t => (t.supplier || '').trim().toUpperCase().includes('ERTAŞ') || (t.supplier || '').trim().toUpperCase().includes('ERTAS'));
  console.log(`Ertaşlar transactions on site: ${siteErtaşlarTxs.length}`);

  let siteErtaşlarAlisTotal = 0;
  let siteErtaşlarTedarikTotal = 0;
  const siteByMonthAlis = {};
  const siteByMonthTedarik = {};
  const siteByHotelAlis = {};
  const siteByHotelTedarik = {};

  siteErtaşlarTxs.forEach(t => {
    const alis = t.qty * t.buyPrice;
    const effectiveSupply = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    const tedarik = t.qty * effectiveSupply;

    siteErtaşlarAlisTotal += alis;
    siteErtaşlarTedarikTotal += tedarik;

    const month = t.date ? t.date.substring(0, 7) : 'Unknown';
    siteByMonthAlis[month] = (siteByMonthAlis[month] || 0) + alis;
    siteByMonthTedarik[month] = (siteByMonthTedarik[month] || 0) + tedarik;

    const hotel = t.hotel || 'Unknown';
    siteByHotelAlis[hotel] = (siteByHotelAlis[hotel] || 0) + alis;
    siteByHotelTedarik[hotel] = (siteByHotelTedarik[hotel] || 0) + tedarik;
  });

  console.log(`\n=== SITE ERTAŞLAR SUMMARY ===`);
  console.log(`Site Ertaşlar Row Count: ${siteErtaşlarTxs.length}`);
  console.log(`Site Ertaşlar Total Alış: ₺${siteErtaşlarAlisTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Site Ertaşlar Total Tedarik: ₺${siteErtaşlarTedarikTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log(`Site Ertaşlar Total Fark (Kar): ₺${(siteErtaşlarTedarikTotal - siteErtaşlarAlisTotal).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`);
  console.log('Site Alış Totals by Month:', siteByMonthAlis);
  console.log('Site Tedarik Totals by Month:', siteByMonthTedarik);

  console.log('\n=== COMPARING ALL OTHER TRANSACTIONS ON SITE ===');
  const otherSuppliers = {};
  siteTxs.forEach(t => {
    const s = t.supplier || 'Bilinmiyor';
    if (!otherSuppliers[s]) otherSuppliers[s] = { count: 0, alis: 0, tedarik: 0 };
    otherSuppliers[s].count++;
    otherSuppliers[s].alis += t.qty * t.buyPrice;
    const eff = (t.supplyPrice > 0) ? t.supplyPrice : t.buyPrice;
    otherSuppliers[s].tedarik += t.qty * eff;
  });

  console.log('All Suppliers on Site:', otherSuppliers);
}

compareExcelWithSite();
