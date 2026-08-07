import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const TUTED_FOLDER = "C:\\Users\\Baran\\Desktop\\tüted";
const firstFile = path.join(TUTED_FOLDER, '30.04.pdf');

const buf = fs.readFileSync(firstFile);
const parser = new PDFParse();
const data = await parser.parse(buf);

console.log('Pages:', data.numpages);
console.log('\n=== FULL TEXT ===');
console.log(data.text);
