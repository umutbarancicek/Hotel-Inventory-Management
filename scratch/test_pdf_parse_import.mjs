import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

console.log('pdf type:', typeof pdf);
console.log('pdf properties:', Object.keys(pdf));

try {
  const { PDFParse } = require('pdf-parse');
  console.log('PDFParse type:', typeof PDFParse);
} catch (e) {
  console.log('PDFParse error:', e.message);
}
