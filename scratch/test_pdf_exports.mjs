import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfObj = require('pdf-parse');

console.log('pdfObj type:', typeof pdfObj);
console.log('pdfObj keys:', Object.keys(pdfObj));
console.log('pdfObj.default:', typeof pdfObj.default);
