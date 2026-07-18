function getTutedMarginRate(hotelName) {
  if (!hotelName) return 1.18;
  const h = hotelName.toUpperCase();
  if (h.includes('SEPHORIA') || h.includes('SEAPHORİA') || h.includes('CASAFORA')) {
    return 1.22;
  }
  return 1.18;
}

const testHotels = [
  'SEPHORIA',
  'SEAPHORİA',
  'Sephoria Hotel',
  'CASAFORA',
  'Casafora Resort',
  'AMBASSADOR',
  'GRAND MİRAMOR',
  'MİR\'AMOR GARDEN',
  'ASTORİA',
  'STELLA'
];

testHotels.forEach(h => {
  const rate = getTutedMarginRate(h);
  const percent = ((rate - 1) * 100).toFixed(0) + '%';
  console.log(`Hotel: "${h}" -> Rate: ${rate} (+${percent})`);
});

const sampleTuted = 100;
console.log('\nSample TÜTED = 100 ₺:');
console.log('Sephoria Supply Price:', sampleTuted * getTutedMarginRate('SEPHORIA'), '₺');
console.log('Ambassador Supply Price:', sampleTuted * getTutedMarginRate('AMBASSADOR'), '₺');
