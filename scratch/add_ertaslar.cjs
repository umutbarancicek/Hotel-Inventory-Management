const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../initialData.js');
let content = fs.readFileSync(filePath, 'utf8');

// Add ERTAŞLAR right after METİN DALKIRAN (last supplier) before hotels
content = content.replace(
  '{"type":"supplier","name":"METİN DALKIRAN"}',
  '{"type":"supplier","name":"METİN DALKIRAN"},\n    {"type":"supplier","name":"ERTAŞLAR"}'
);

fs.writeFileSync(filePath, content);
console.log('Successfully added ERTAŞLAR as a supplier!');
