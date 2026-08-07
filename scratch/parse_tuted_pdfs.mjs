/**
 * 1. Desktop'taki tüted PDF'lerini parse et
 * 2. Firestore priceLists collection'a kaydet
 * 3. Ardından tüm Ertaşlar transaction'larının supplyPrice'ını doğru TÜTED fiyatıyla hesapla
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

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

const TUTED_FOLDER = "C:\\Users\\Baran\\Desktop\\tüted";

// ─── PDF PARSE ───────────────────────────────────────────────────────────────

function parsePdfText(pdfPath) {
  // Use pdftotext if available, otherwise try pdf-parse
  try {
    const text = execSync(`pdftotext -layout "${pdfPath}" -`, { encoding: 'utf8', timeout: 10000 });
    return text;
  } catch (e) {
    // Try alternative
    try {
      const text = execSync(`"C:\\Program Files\\poppler\\Library\\bin\\pdftotext.exe" -layout "${pdfPath}" -`, { encoding: 'utf8', timeout: 10000 });
      return text;
    } catch (e2) {
      return null;
    }
  }
}

// Parse Turkish price numbers like "1.234,56" or "1234,56" or "1234.56"
function parseTRPrice(str) {
  if (!str) return null;
  const s = str.trim().replace(/\s/g, '');
  // Turkish format: 1.234,56 → 1234.56
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }
  // Already decimal: 1234.56
  if (/^\d+(\.\d+)?$/.test(s)) {
    return parseFloat(s);
  }
  // Turkish no-dot format: 1234,56
  if (/^\d+,\d+$/.test(s)) {
    return parseFloat(s.replace(',', '.'));
  }
  return null;
}

function parseBoraListFromText(text) {
  const prices = {};
  const lines = text.split('\n');
  
  let inPriceSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Detect price section start  
    if (trimmed.includes('ANTALYA HAL') || trimmed.includes('ANTALYA TOPTANCI HAL')) {
      inPriceSection = true;
    }
    
    if (!inPriceSection) continue;
    
    // Try to extract: PRODUCT_NAME ... PRICE
    // Lines look like: "DOMATES         I.KAL.   KG    50,00    55,00   45,00"
    // or: "DOMATES                               50,00"
    
    // Match lines with product name and price(s)
    // Pattern: text followed by numbers with commas/dots
    const priceMatch = trimmed.match(/^(.+?)\s{2,}([\d.,]+(?:\s+[\d.,]+)*)\s*$/);
    if (priceMatch) {
      const namePart = priceMatch[1].trim().toUpperCase();
      const pricePart = priceMatch[2].trim();
      
      // Skip header lines
      if (namePart.includes('ÜRÜN') || namePart.includes('FİYAT') || namePart.includes('MAL ADI')) continue;
      if (namePart.length < 3 || /^\d/.test(namePart)) continue;
      
      // Take the first price number
      const priceNums = pricePart.split(/\s+/).map(p => parseTRPrice(p)).filter(p => p !== null && p > 0);
      if (priceNums.length > 0) {
        // Use the "orta" (middle) price or last price — typically the borsa reference
        // For TÜTED lists, we want the "orta fiyat" which is the market reference
        const price = priceNums[Math.floor(priceNums.length / 2)] || priceNums[0];
        if (price > 0 && price < 10000) {
          prices[namePart] = price;
        }
      }
    }
  }
  
  return prices;
}

// More robust parser using regex patterns common in TÜTED PDFs
function parseBoraListRobust(text) {
  const prices = {};
  
  // Split into lines and look for product-price patterns
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Skip very short lines or pure number lines
    if (line.trim().length < 5) continue;
    
    // Common pattern: PRODUCT_NAME followed by prices
    // Example: "DOMATES I.KAL      50,00     60,00     45,00"
    // We want the main price (usually last or middle)
    
    // Match: letters/spaces (product) then numbers
    const m = line.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü\s\-\.\/()0-9]{3,40}?)\s{2,}((?:\d[\d.,]*\s*)+)$/);
    if (!m) continue;
    
    let name = m[1].trim().toUpperCase();
    if (!name || name.length < 2) continue;
    if (/^\d/.test(name)) continue;
    // Skip header words
    if (['ÜRÜN ADI', 'MAL ADI', 'FİYAT', 'EN YÜKSEK', 'EN DÜŞÜK', 'ORTA', 'BİRİM', 'TOPLAM'].some(h => name.includes(h))) continue;
    
    const numStr = m[2].trim();
    const nums = numStr.split(/\s+/).map(n => parseTRPrice(n)).filter(n => n !== null && n > 0 && n < 50000);
    
    if (nums.length === 0) continue;
    
    // For TÜTED borsa: usually 3 prices (min, max, avg) or just one
    // We want the "orta" (average/reference) price
    let price;
    if (nums.length >= 3) {
      price = nums[1]; // Middle = orta fiyat
    } else {
      price = nums[nums.length - 1];
    }
    
    if (price > 0) {
      prices[name] = price;
    }
  }
  
  return prices;
}

// ─── FILENAME → DATE ─────────────────────────────────────────────────────────
// Files named like "30.04.pdf", "01.05.pdf" etc.
function fileNameToDate(filename) {
  const base = path.basename(filename, '.pdf');
  const parts = base.split('.');
  if (parts.length === 2) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `2026-${month}-${day}`;
  }
  return null;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const files = fs.readdirSync(TUTED_FOLDER).filter(f => f.endsWith('.pdf')).sort();
  console.log(`Found ${files.length} PDF files in tüted folder:`);
  files.forEach(f => console.log(`  ${f}`));
  
  // First, check if pdftotext is available
  let pdfToolAvailable = false;
  try {
    execSync('pdftotext -v', { encoding: 'utf8', timeout: 3000, stdio: 'pipe' });
    pdfToolAvailable = true;
    console.log('\npdftotext: available');
  } catch(e) {
    // Check if pdf-parse npm package is available  
    try {
      const { default: pdfParse } = await import('pdf-parse');
      global.pdfParse = pdfParse;
      pdfToolAvailable = true;
      console.log('\npdf-parse: available');
    } catch(e2) {
      console.log('\nNeither pdftotext nor pdf-parse available. Will try to install pdf-parse...');
    }
  }
  
  // Try to parse first PDF and show output
  const firstFile = files[0];
  const firstPath = path.join(TUTED_FOLDER, firstFile);
  console.log(`\nTesting parse on: ${firstFile}`);
  
  // Try with pdf-parse
  try {
    const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const buf = fs.readFileSync(firstPath);
    const data = await pdfParse(buf);
    console.log('PDF text (first 2000 chars):');
    console.log(data.text.substring(0, 2000));
    console.log('\n--- END SAMPLE ---');
  } catch(e) {
    console.log('pdf-parse failed:', e.message);
    // Try pdftotext
    const text = parsePdfText(firstPath);
    if (text) {
      console.log('pdftotext output (first 2000 chars):');
      console.log(text.substring(0, 2000));
    } else {
      console.log('Both methods failed. Trying node-poppler or other...');
    }
  }
}

main().catch(console.error);
