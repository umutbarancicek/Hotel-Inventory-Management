import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

async function extractItems() {
  const pdfPath = 'C:\\Users\\Baran\\Desktop\\mallar.pdf';
  const dataBuffer = fs.readFileSync(pdfPath);

  function render_page(pageData) {
    let render_options = {
      normalizeWhitespace: false,
      disableCombineTextItems: false
    }
    return pageData.getTextContent(render_options)
      .then(function(textContent) {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY){
            text += item.str + ' ';
          } else{
            text += '\n' + item.str + ' ';
          }
          lastY = item.transform[5];
        }
        return text;
      });
  }

  const options = {
    pagerender: render_page
  };

  const parser = new PDFParse(new Uint8Array(dataBuffer), options);
  const data = await parser.getText();
  console.log('Extracted custom text length:', data.text.length);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  console.log('Total non-trivial text lines:', lines.length);
  console.log('\nFirst 30 text lines from pdf:');
  lines.slice(0, 30).forEach((l, i) => console.log(`${i+1}: ${l}`));
}

extractItems().catch(console.error);
