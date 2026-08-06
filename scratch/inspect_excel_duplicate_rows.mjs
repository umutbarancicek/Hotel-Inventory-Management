import fs from 'fs';
import * as XLSX from 'xlsx';

const pathExcel = "C:\\Users\\Baran\\Downloads\\Ertaşlar - Ram - Şimal 04.08.2026 (1).xlsx";

async function inspectRows() {
  const buf = fs.readFileSync(pathExcel);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Sheet'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

  console.log('Row 43:', rows[42]);
  console.log('Row 54:', rows[53]);
  console.log('\nRow 41 (Maydanoz):', rows[40]);
  console.log('Row 75 (Maydanoz):', rows[74]);
  console.log('Row 81 (Maydanoz):', rows[80]);
}

inspectRows().catch(console.error);
