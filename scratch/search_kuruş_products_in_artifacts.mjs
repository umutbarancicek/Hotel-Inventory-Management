import fs from 'fs';
import path from 'path';

const brainDir = "C:\\Users\\Baran\\.gemini\\antigravity\\brain\\d02cd299-38ad-4e8e-bbdf-215579ee876f";

function searchLogs(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      searchLogs(full);
    } else if (file.endsWith('.jsonl') || file.endsWith('.md')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('kuruş') || content.includes('küsürat') || content.includes('fark')) {
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('kuruş') || line.includes('küsürat') || line.includes('0.22') || line.includes('0.18')) {
            if (line.length < 300) console.log(`[${file}:${i+1}] ${line}`);
          }
        });
      }
    }
  });
}

searchLogs(brainDir);
