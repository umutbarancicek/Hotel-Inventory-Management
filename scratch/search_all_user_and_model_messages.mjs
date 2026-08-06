import fs from 'fs';

const logPath = "C:\\Users\\Baran\\.gemini\\antigravity\\brain\\d02cd299-38ad-4e8e-bbdf-215579ee876f\\.system_generated\\logs\\transcript_full.jsonl";

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (!line) return;
    try {
      const obj = JSON.parse(line);
      const text = obj.content || '';
      if (text.includes('HAVUÇ') || text.includes('SİLOR') || text.includes('LİMON') || text.includes('PORTAKAL') || text.includes('DOMATES') || text.includes('BİBER') || text.includes('kuruş') || text.includes('fark')) {
        if (obj.source === 'USER_EXPLICIT' || (obj.source === 'MODEL' && (text.includes('ürün') || text.includes('fiyat')))) {
          console.log(`\n--- [Step ${obj.step_index}] Source: ${obj.source} ---`);
          console.log(text.slice(0, 400));
        }
      }
    } catch(e) {}
  });
}
