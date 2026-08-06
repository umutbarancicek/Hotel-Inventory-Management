import fs from 'fs';

function parseHtml() {
  const html = fs.readFileSync('scratch/tuted_index.html', 'utf8');
  console.log('=== SEARCHING HTML FOR PATTERNS ===');

  // Let's find all href containing excel, index or download
  const hrefs = [];
  const regex = /href="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    if (url.includes('excel') || url.includes('Excel') || url.includes('Fiyat') || url.includes('Download')) {
      hrefs.push(url);
    }
  }
  console.log('Matching Hrefs:', hrefs);

  // Let's print out all lines containing <tr> to see table structure
  const lines = html.split('\n');
  let printCount = 0;
  console.log('\n=== TABLE ROWS OR TR LINES ===');
  lines.forEach((line, idx) => {
    if (line.includes('<tr>') || line.includes('<td>') || line.includes('Fiyat')) {
      if (printCount < 40) {
        console.log(`${idx}: ${line.trim()}`);
        printCount++;
      }
    }
  });
}

parseHtml();
