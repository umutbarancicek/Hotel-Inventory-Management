import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA1Iv_1fkFSVI-P4Y_g1QlCgB4CMsRZJFI",
  authDomain: "miramor-inventory-management.firebaseapp.com",
  projectId: "miramor-inventory-management",
  storageBucket: "miramor-inventory-management.firebasestorage.app",
  messagingSenderId: "539349013423",
  appId: "1:539349013423:web:53cb425931b51b1530d55a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generateReport() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  const data = docSnap.data();

  const transactions = data.transactions || [];
  const priceLists = data.priceLists || {};

  const byDate = {};

  transactions.forEach(t => {
    const list = priceLists[t.date] || [];
    const prodClean = (t.product || '').trim().toUpperCase();

    let pMatch = list.find(p => (p.product || '').trim().toUpperCase() === prodClean);
    if (!pMatch && list.length > 0) {
      pMatch = list.find(p => {
        const pName = (p.product || '').trim().toUpperCase();
        return pName.includes(prodClean) || prodClean.includes(pName);
      });
    }

    if (!pMatch) {
      if (!byDate[t.date]) {
        byDate[t.date] = {
          hasList: list.length > 0,
          items: []
        };
      }
      byDate[t.date].items.push(t);
    }
  });

  const sortedDates = Object.keys(byDate).sort();

  let md = `# 📋 TÜTED BORSA FİYATI BULUNAMAYAN / GİRİLMEYEN TARİH VE ÜRÜNLER LİSTESİ\n\n`;
  md += `> **Rapor Amacı:** Ekranınızda TÜTED sütununda \`—\` (tire) görünen ve Tedarik Fiyatı Alış Fiyatına eşitlenmiş olan tüm tarih ve ürünlerin tam dökümüdür.\n`;
  md += `> **Not Alma Rehberi:** Aşağıdaki tarih ve ürün gruplarını inceleyerek eksik borsa fiyatlarını tamamlayabilirsiniz.\n\n---\n\n`;
  md += `## 📊 ÖZET İSTATİSTİKLER\n\n`;
  md += `- **Toplam İncelenen İşlem:** ${transactions.length} Adet\n`;
  md += `- **TÜTED Fiyatı Olmayan İşlem:** ${Object.values(byDate).reduce((acc, d) => acc + d.items.length, 0)} Kalem\n`;
  md += `- **Eksik Fiyatlı Toplam Tarih Sayısı:** ${sortedDates.length} Gün\n\n---\n\n`;
  md += `## 📅 TARİH BAZLI EKSİK ÜRÜNLER LİSTESİ\n\n`;

  sortedDates.forEach(date => {
    const group = byDate[date];
    const formattedDate = date.split('-').reverse().join('.');
    const reasonText = group.hasList 
      ? '⚠️ Bu tarihte borsa bülteni var ancak listede ilgili ürünler bulunamadı.' 
      : '❌ Bu tarihe ait sistemde hiç TÜTED Borsa Bülteni yok.';

    md += `### 🗓️ Tarih: **${formattedDate}** (${group.items.length} Kalem İşlem)\n`;
    md += `> **Durum:** ${reasonText}\n\n`;
    md += `| Müstahsil / Tedarikçi | Otel Deposu | Mal / Ürün Adı | Miktar | Alış Fiyatı |\n`;
    md += `| :--- | :--- | :--- | :---: | :---: |\n`;

    group.items.forEach(item => {
      md += `| **${item.supplier}** | ${item.hotel} | **${item.product}** | ${item.qty} | ₺${item.buyPrice} |\n`;
    });

    md += `\n---\n\n`;
  });

  fs.writeFileSync('C:\\Users\\Baran\\.gemini\\antigravity\\brain\\d02cd299-38ad-4e8e-bbdf-215579ee876f\\tuted_eksik_urunler_ve_tarihler.md', md, 'utf8');
  console.log('Report generated successfully!');
}

generateReport();
