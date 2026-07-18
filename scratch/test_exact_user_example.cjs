function calcTedarikFiyati(tutedPrice, hotelName) {
  const hUpper = (hotelName || '').toUpperCase().trim();
  const isSpecial = hUpper.includes('SEPHORIA') || hUpper.includes('SEAPHORİA') || hUpper.includes('CASAFORA');
  const rate = isSpecial ? 0.22 : 0.18;
  return Math.round(tutedPrice * rate * 100) / 100;
}

console.log('TÜTED = 100 TL, Hotel = CASAFORA -> Tedarik:', calcTedarikFiyati(100, 'CASAFORA'), 'TL (Expected 22 TL)');
console.log('TÜTED = 100 TL, Hotel = SEPHORIA -> Tedarik:', calcTedarikFiyati(100, 'SEPHORIA'), 'TL (Expected 22 TL)');
console.log('TÜTED = 100 TL, Hotel = AMBASSADOR -> Tedarik:', calcTedarikFiyati(100, 'AMBASSADOR'), 'TL (Expected 18 TL)');
console.log('TÜTED = 100 TL, Hotel = GRAND MİRAMOR -> Tedarik:', calcTedarikFiyati(100, 'GRAND MİRAMOR'), 'TL (Expected 18 TL)');

console.log('TÜTED = 50 TL, Hotel = CASAFORA -> Tedarik:', calcTedarikFiyati(50, 'CASAFORA'), 'TL (Expected 11 TL)');
console.log('TÜTED = 50 TL, Hotel = AMBASSADOR -> Tedarik:', calcTedarikFiyati(50, 'AMBASSADOR'), 'TL (Expected 9 TL)');
