// Let's write a script to find combinations or check if there is an error in some line.
// The handwritten sum is 137970.
// Let's print out the value for each item in a table so we can check it.
const items = [
  { name: 'Şeftali', casa: 62, seaph: 52, total: 114, price: 50 },
  { name: 'U.Elma', casa: 115, seaph: 24, total: 139, price: 55 },
  { name: 'Yerli biber', casa: 86, seaph: 29, total: 115, price: 70 },
  { name: 'Soğan', casa: 312, seaph: 130, total: 442, price: 60 },
  { name: 'Salatalık', casa: 252, seaph: 95, total: 347, price: 20 },
  { name: 'Semizotu', casa: 80, seaph: 80, total: 160, price: 10 },
  { name: 'Sivri biber', casa: 0, seaph: 24, total: 24, price: 70 },
  { name: 'Roka', casa: 120, seaph: 120, total: 240, price: 9 },
  { name: 'Patates', casa: 160, seaph: 82, total: 242, price: 42 },
  { name: 'Portakal', casa: 122, seaph: 49, total: 171, price: 25 },
  { name: 'Patlıcan', casa: 66, seaph: 80, total: 146, price: 20 },
  { name: 'Nektarin', casa: 50, seaph: 36, total: 86, price: 50 },
  { name: 'Nane', casa: 80, seaph: 80, total: 160, price: 10 },
  { name: 'Muz', casa: 290, seaph: 0, total: 290, price: 19 },
  { name: 'Maydanoz', casa: 80, seaph: 80, total: 160, price: 9 },
  { name: 'Marul', casa: 21, seaph: 35, total: 56, price: 20 },
  { name: 'Lolorosso', casa: 24, seaph: 24, total: 48, price: 25 },
  { name: 'Limon', casa: 102, seaph: 90, total: 192, price: 60 },
  { name: 'K.Lahana', casa: 65, seaph: 19, total: 84, price: 30 },
  { name: 'Kıvırcık', casa: 18, seaph: 42, total: 60, price: 20 },
  { name: 'Kayısı', casa: 109, seaph: 0, total: 109, price: 50 },
  { name: 'Kabak', casa: 85, seaph: 36, total: 121, price: 25 },
  { name: 'Havuç', casa: 110, seaph: 30, total: 140, price: 25 },
  { name: 'Fesleğen', casa: 20, seaph: 20, total: 40, price: 15 },
  { name: 'Erik', casa: 76, seaph: 42, total: 118, price: 50 },
  { name: 'K.Elma', casa: 103, seaph: 45, total: 148, price: 45 },
  { name: 'D.Elma', casa: 61, seaph: 43, total: 104, price: 50 },
  { name: 'Kokteyl', casa: 31, seaph: 32, total: 63, price: 55 },
  { name: 'Dereotu', casa: 80, seaph: 40, total: 120, price: 10 },
  { name: 'Dolma biber', casa: 29, seaph: 17, total: 46, price: 60 },
  { name: 'Domates', casa: 108, seaph: 180, total: 288, price: 25 },
  { name: 'B.Lahana', casa: 0, seaph: 36, total: 36, price: 20 },
  { name: 'Pancar', casa: 0, seaph: 20, total: 20, price: 35 },
  { name: 'Aysberg', casa: 0, seaph: 24, total: 24, price: 25 },
  { name: 'Greyfurt', casa: 0, seaph: 59, total: 59, price: 30 } // Let's try Seaph = 59, total = 59
];

// Let's print out the calculation of each line to see if we can find any discrepancy.
let calculatedTotal = 0;
items.forEach(i => {
  const lineVal = i.total * i.price;
  calculatedTotal += lineVal;
});
console.log('Total calculated with Greyfurt total 59:', calculatedTotal);

// What if U.Elma is 115 * 55 for Casa, 24 * 55 for Seaph?
// Wait, is there any item that is not a transaction but rather something else?
// Let's check if the sum 137.970 is written at the bottom.
// Wait, yes, "137.970" is written in blue ink.
// Let's check if Soğan is 442 * 6.00 = 2652? If Soğan price is 6.00 instead of 60.00:
// Then Soğan line sum is 2652 instead of 26520.
// Let's check: 26520 - 2652 = 23868 difference.
// 158464 - 23868 = 134596.
// Let's check other prices. If Limon price is 6.00 instead of 60.00:
// Limon line sum would be 1152 instead of 11520. Difference = 10368.
// If Soğan is 6.00, Limon is 6.00, Biber Dolma is 6.00, Sivri Biber is 7.00, Yerli Biber is 7.00:
// Let's do a calculation with actual division by 10 for prices that are > 10 (e.g. 50 is 5.0, 55 is 5.5, 70 is 7.0, 60 is 6.0, 42 is 4.2).
// Wait! If all prices are divided by 10 (so 50 becomes 5.0, 42 becomes 4.2, 9 becomes 0.9):
// Then the sum would be 15846.40 TL!
// But the written total is 137.970! That is 137 thousand!
// Wait! If the written total is 137 thousand, then the sum must be in the range of 130,000-150,000.
// Our calculated sum is 158,464.
// Let's see: 158,464 is very close to 137,970.
// Let's check if the difference is because some items are excluded.
// For example, if we exclude Soğan (26,520):
// 158,464 - 26,520 = 131,944.
// Let's check if there is an addition error in the notebook. Hand-written additions often have errors.
