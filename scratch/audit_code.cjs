const fs = require('fs');

const jsContent = fs.readFileSync('main.js', 'utf8');

// Check for unescaped inline onclick handlers with strings
const onclickMatches = [...jsContent.matchAll(/onclick="[^"]*'\$\{([^}]+)\}'[^"]*"/g)];
console.log('Total inline single-quoted onclick interpolation count:', onclickMatches.length);
onclickMatches.forEach((m, idx) => {
  if (!m[0].includes('replace') && !m[0].includes('.id') && !m[0].includes('fd.key')) {
    console.log(`[Warning potential unescaped quote] Match #${idx+1}:`, m[0].trim());
  }
});

// Check for potential NaN or undefined in formatCurrency
console.log('formatCurrency defined check...');
