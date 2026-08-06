const pdf = require('pdf-parse');
console.log('typeof pdf:', typeof pdf);
console.log('keys of pdf:', Object.keys(pdf));
console.log('pdf properties:', Object.getOwnPropertyNames(pdf));
console.log('pdf structure:', pdf.toString());
