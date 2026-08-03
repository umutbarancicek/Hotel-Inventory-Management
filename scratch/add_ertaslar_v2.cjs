const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../initialData.js');
let content = fs.readFileSync(filePath, 'utf8');

// The format uses multi-line JSON. Add ERTAŞLAR after METİN DALKIRAN block
const target = `    {\n      "type": "supplier",\n      "name": "METİN DALKIRAN"\n    },`;
const replacement = `    {\n      "type": "supplier",\n      "name": "METİN DALKIRAN"\n    },\n    {\n      "type": "supplier",\n      "name": "ERTAŞLAR"\n    },`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content);
  console.log('✅ Successfully added ERTAŞLAR!');
} else {
  console.error('❌ Could not find exact target block. Trying CRLF...');
  const targetCRLF = `    {\r\n      "type": "supplier",\r\n      "name": "MET\u0130N DALKIRAN"\r\n    },`;
  console.log('Has METİN DALKIRAN (any format)?', content.includes('METİN DALKIRAN'));
  
  // Find and log the actual surrounding characters
  const idx = content.indexOf('"METİN DALKIRAN"');
  console.log('Char before block:', JSON.stringify(content.substring(idx - 40, idx + 50)));
}
