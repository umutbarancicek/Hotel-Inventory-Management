import fs from 'fs';
import * as XLSX from 'xlsx';

const path1 = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026.xlsx";
const path2 = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";

[path1, path2].forEach((p, idx) => {
  if (fs.existsSync(p)) {
    console.log(`\n=== File ${idx+1}: ${p} ===`);
    const buf = fs.readFileSync(p);
    const wb = XLSX.read(buf, { type: 'buffer' });
    console.log('Sheets:', wb.SheetNames);
    wb.SheetNames.forEach(s => {
      const ws = wb.Sheets[s];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log(`Sheet "${s}" (${rows.length} rows):`, rows.slice(0, 5));
    });
  }
});
