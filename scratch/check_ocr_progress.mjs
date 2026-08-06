import fs from 'fs';

const jsonPath = 'C:\\Users\\Baran\\Documents\\GitHub\\Hotel-Inventory-Management\\scratch\\mallar_ocr_parsed.json';
if (fs.existsSync(jsonPath)) {
  const stat = fs.statSync(jsonPath);
  console.log(`mallar_ocr_parsed.json exists! Size: ${stat.size} bytes`);
} else {
  console.log('mallar_ocr_parsed.json not written yet (OCR in progress...)');
}
