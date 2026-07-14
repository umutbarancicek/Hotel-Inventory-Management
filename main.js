import './style.css';
import { DataService } from './dataService.js';

DataService.init();

const body = document.body;
document.getElementById('theme-toggle').addEventListener('click', () => {
  body.classList.toggle('light-theme');
  const icon = document.querySelector('#theme-toggle i');
  if(body.classList.contains('light-theme')) {
    icon.classList.replace('fa-sun', 'fa-moon');
  } else {
    icon.classList.replace('fa-moon', 'fa-sun');
  }
});

// Format Currency
const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

const formatAppDate = (isoDate) => {
  if (!isoDate) return '-';
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
};

function renderDashboard() {
  const data = DataService.getData();
  const stats = DataService.getDashboardStats();
  
  // Summary Bar
  document.getElementById('sum-date').innerText = new Date().toLocaleDateString('tr-TR');
  document.getElementById('sum-kg').innerText = stats.totalQty.toLocaleString('tr-TR');
  document.getElementById('sum-tedarik').innerText = formatCurrency(stats.totalSupply);
  document.getElementById('sum-alis').innerText = formatCurrency(stats.totalHal);
  document.getElementById('sum-fark').innerText = formatCurrency(stats.profit);

  // Buttons
  const supplierCol = document.getElementById('supplier-buttons');
  const hotelCol = document.getElementById('hotel-buttons');
  
  supplierCol.innerHTML = '';
  hotelCol.innerHTML = '';

  data.accounts.forEach(acc => {
    const btn = document.createElement('button');
    btn.className = `dash-btn ${acc.type === 'supplier' ? 'btn-green' : 'btn-black'}`;
    btn.innerText = acc.name;
    btn.onclick = () => showAccountDetail(acc);
    
    if (acc.type === 'supplier') supplierCol.appendChild(btn);
    else hotelCol.appendChild(btn);
  });

  // Populate form selects
  const suppliers = data.accounts.filter(a => a.type === 'supplier').map(a => `<option value="${a.name}">${a.name}</option>`).join('');
  const hotels = data.accounts.filter(a => a.type === 'hotel').map(a => `<option value="${a.name}">${a.name}</option>`).join('');
  const allAccs = data.accounts.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
  const prods = data.prices.map(p => `<option value="${p.product}">${p.product}</option>`).join('');
  
  document.getElementById('q-p-account').innerHTML = allAccs;
  document.getElementById('q-v-supplier').innerHTML = suppliers;
  document.getElementById('q-v-hotel').innerHTML = hotels;
  document.getElementById('q-v-product').innerHTML = prods;
  document.getElementById('q-p-date').valueAsDate = new Date();
  document.getElementById('q-v-date').valueAsDate = new Date();
}

// Form Tabs
document.querySelectorAll('.form-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-body').forEach(b => b.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(`tab-${e.target.dataset.tab}`).classList.add('active');
  });
});

// Save Payment
document.getElementById('q-p-save').addEventListener('click', () => {
  DataService.addPayment({
    date: document.getElementById('q-p-date').value,
    account: document.getElementById('q-p-account').value,
    amount: Number(document.getElementById('q-p-amount').value),
    description: document.getElementById('q-p-desc').value
  });
  alert('Ödeme Kaydedildi!');
  renderDashboard();
});

// Save Tx
document.getElementById('q-v-save').addEventListener('click', () => {
  DataService.addTransaction({
    date: document.getElementById('q-v-date').value,
    supplier: document.getElementById('q-v-supplier').value,
    hotel: document.getElementById('q-v-hotel').value,
    product: document.getElementById('q-v-product').value,
    qty: Number(document.getElementById('q-v-qty').value),
    buyPrice: Number(document.getElementById('q-v-buy').value),
    supplyPrice: Number(document.getElementById('q-v-supply').value)
  });
  alert('İşlem Kaydedildi!');
  renderDashboard();
});

// Navigation
const viewDash = document.getElementById('view-dashboard');
const viewOther = document.getElementById('view-other');
const viewContent = document.getElementById('view-content');
const viewTitle = document.getElementById('view-title');

document.getElementById('btn-back-home').addEventListener('click', () => {
  viewOther.classList.remove('active');
  viewDash.classList.add('active');
});

document.querySelectorAll('.dash-btn[data-nav]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const nav = e.target.dataset.nav;
    viewDash.classList.remove('active');
    viewOther.classList.add('active');
    
    if (nav === 'veri') renderVeri();
    else if (nav === 'odemeler') renderOdemeler();
    else if (nav === 'fiyat') renderFiyat();
    else if (nav === 'pivot') renderPivot();
    else if (nav === 'ozet') renderOzet();
    else {
      viewTitle.innerText = nav.toUpperCase();
      viewContent.innerHTML = '<p>Bu modül yapım aşamasındadır.</p>';
    }
  });
});

function renderVeri() {
  viewTitle.innerText = 'VERİ (İşlemler)';
  const txs = DataService.getData().transactions;
  let html = `<table>
    <thead><tr><th>TARİH</th><th>MÜSTAHSİL</th><th>MAL</th><th>KİLO</th><th>GİTTİĞİ YER</th><th>ALIŞ FİAT</th><th>TEDA FİAT</th><th>HAL TUTAR</th><th>TEDARİK TUTAR</th><th>FARK</th></tr></thead>
    <tbody>`;
  txs.reverse().forEach(tx => {
    const hal = tx.qty * tx.buyPrice;
    const ted = tx.qty * tx.supplyPrice;
    html += `<tr>
      <td>${formatAppDate(tx.date)}</td><td>${tx.supplier}</td><td>${tx.product}</td><td>${tx.qty}</td><td>${tx.hotel}</td>
      <td>${formatCurrency(tx.buyPrice)}</td><td>${formatCurrency(tx.supplyPrice)}</td>
      <td>${formatCurrency(hal)}</td><td>${formatCurrency(ted)}</td>
      <td><span class="${ted-hal >= 0 ? 'success' : 'danger'}">${formatCurrency(ted-hal)}</span></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  viewContent.innerHTML = html;
}

function renderOdemeler() {
  viewTitle.innerText = 'ÖDEMELER';
  const py = DataService.getData().payments;
  let html = `<table>
    <thead><tr><th>TARİH</th><th>CARİ ADI</th><th>ÖDEME TUTARI</th><th>AÇIKLAMA</th></tr></thead>
    <tbody>`;
  py.reverse().forEach(p => {
    html += `<tr><td>${formatAppDate(p.date)}</td><td>${p.account}</td><td>${formatCurrency(p.amount)}</td><td>${p.description}</td></tr>`;
  });
  html += `</tbody></table>`;
  viewContent.innerHTML = html;
}

function renderFiyat() {
  viewTitle.innerText = 'FİYAT LİSTESİ';
  const pr = DataService.getData().prices;
  let html = `<table>
    <thead><tr><th>MAL</th><th>BİRİM</th><th>FİYAT</th></tr></thead>
    <tbody>`;
  pr.forEach(p => {
    html += `<tr><td>${p.product}</td><td>${p.unit}</td><td>${formatCurrency(p.price)}</td></tr>`;
  });
  html += `</tbody></table>`;
  viewContent.innerHTML = html;
}

function renderOzet() {
  viewTitle.innerText = 'CARİ HESAP ÖZETLERİ';
  const balances = DataService.getAccountBalances();
  let html = `<table>
    <thead><tr><th>CARİ TİPİ</th><th>CARİ ADI</th><th>İŞLEM HACMİ</th><th>ÖDENEN</th><th>BAKİYE</th></tr></thead>
    <tbody>`;
  balances.forEach(b => {
    html += `<tr>
      <td>${b.type === 'supplier' ? 'Tedarikçi' : 'Müşteri'}</td>
      <td><strong>${b.name}</strong></td>
      <td>${formatCurrency(b.totalBought)}</td>
      <td>${formatCurrency(b.totalPaid)}</td>
      <td>${formatCurrency(b.balance)}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  viewContent.innerHTML = html;
}

function showAccountDetail(acc) {
  viewDash.classList.remove('active');
  viewOther.classList.add('active');
  viewTitle.innerText = `${acc.name} - HESAP EKSTRESİ`;
  
  const data = DataService.getData();
  const txs = data.transactions.filter(t => t.hotel === acc.name || t.supplier === acc.name);
  const pms = data.payments.filter(p => p.account === acc.name);
  
  const balances = DataService.getAccountBalances();
  const b = balances.find(x => x.name === acc.name);
  
  let html = `
    <div style="display: flex; gap: 24px; margin-bottom: 24px;">
      <div class="glass-panel" style="flex: 1; text-align: center;"><h3>TOPLAM İŞLEM</h3><h2 style="color: #60a5fa;">${formatCurrency(b.totalBought)}</h2></div>
      <div class="glass-panel" style="flex: 1; text-align: center;"><h3>TOPLAM ÖDENEN</h3><h2 style="color: #eab308;">${formatCurrency(b.totalPaid)}</h2></div>
      <div class="glass-panel" style="flex: 1; text-align: center;"><h3>KALAN BAKİYE</h3><h2 style="color: ${b.balance >= 0 ? '#10b981' : '#ef4444'};">${formatCurrency(b.balance)}</h2></div>
    </div>
    <h3>Son İşlemler</h3>
    <table><thead><tr><th>Tarih</th><th>Ürün/Açıklama</th><th>Tutar</th><th>Tip</th></tr></thead><tbody>
  `;
  
  const allEvents = [
    ...txs.map(t => ({ date: t.date, desc: `${t.qty} Kg ${t.product}`, amount: acc.type === 'supplier' ? (t.qty*t.buyPrice) : (t.qty*t.supplyPrice), type: 'Alım/Satım' })),
    ...pms.map(p => ({ date: p.date, desc: p.description, amount: p.amount, type: 'Ödeme' }))
  ].sort((a,b) => new Date(b.date) - new Date(a.date));
  
  allEvents.forEach(e => {
    html += `<tr><td>${formatAppDate(e.date)}</td><td>${e.desc}</td><td>${formatCurrency(e.amount)}</td><td>${e.type}</td></tr>`;
  });
  
  html += `</tbody></table>`;
  viewContent.innerHTML = html;
}

let pivotFilters = { hotel: null, supplier: null, product: null };
function renderPivot() {
  viewTitle.innerText = 'PİVOT TABLO';
  const data = DataService.getData();
  
  // Extract unique values
  const hotels = [...new Set(data.transactions.map(t => t.hotel))];
  const suppliers = [...new Set(data.transactions.map(t => t.supplier))];
  const prods = [...new Set(data.transactions.map(t => t.product))];
  
  const renderSlicer = (title, items, key) => `
    <div class="slicer-group">
      <div class="slicer-header">${title} <i class="fa-solid fa-filter"></i></div>
      <div class="slicer-list">
        <div class="slicer-item ${pivotFilters[key] === null ? 'active' : ''}" onclick="window.setPivotFilter('${key}', null)">(Tümü)</div>
        ${items.map(i => `<div class="slicer-item ${pivotFilters[key] === i ? 'active' : ''}" onclick="window.setPivotFilter('${key}', '${i}')">${i}</div>`).join('')}
      </div>
    </div>
  `;
  
  // Filter Data
  let filtered = data.transactions.filter(t => {
    if (pivotFilters.hotel && t.hotel !== pivotFilters.hotel) return false;
    if (pivotFilters.supplier && t.supplier !== pivotFilters.supplier) return false;
    if (pivotFilters.product && t.product !== pivotFilters.product) return false;
    return true;
  });
  
  // Group Data by Hotel -> Product
  const grouped = {};
  let gKg = 0, gHal = 0, gTed = 0, gFark = 0;
  
  filtered.forEach(t => {
    if (!grouped[t.hotel]) grouped[t.hotel] = { sumKg: 0, sumHal: 0, sumTed: 0, sumFark: 0, prods: {} };
    if (!grouped[t.hotel].prods[t.product]) grouped[t.hotel].prods[t.product] = { sumKg: 0, sumHal: 0, sumTed: 0, sumFark: 0 };
    
    const hal = t.qty * t.buyPrice;
    const ted = t.qty * t.supplyPrice;
    const fark = ted - hal;
    
    grouped[t.hotel].prods[t.product].sumKg += t.qty;
    grouped[t.hotel].prods[t.product].sumHal += hal;
    grouped[t.hotel].prods[t.product].sumTed += ted;
    grouped[t.hotel].prods[t.product].sumFark += fark;
    
    grouped[t.hotel].sumKg += t.qty;
    grouped[t.hotel].sumHal += hal;
    grouped[t.hotel].sumTed += ted;
    grouped[t.hotel].sumFark += fark;
    
    gKg += t.qty; gHal += hal; gTed += ted; gFark += fark;
  });
  
  let tableHtml = `<table>
    <thead><tr><th>Satır Etiketleri</th><th>Toplam KİLO</th><th>Toplam TEDARİK</th><th>Toplam HAL</th><th>Toplam FARK</th></tr></thead>
    <tbody>`;
    
  Object.keys(grouped).sort().forEach(h => {
    const d = grouped[h];
    tableHtml += `<tr class="pivot-row-group">
      <td><i class="fa-solid fa-minus"></i> ${h}</td>
      <td>${d.sumKg}</td><td>${formatCurrency(d.sumTed)}</td><td>${formatCurrency(d.sumHal)}</td><td>${formatCurrency(d.sumFark)}</td>
    </tr>`;
    
    Object.keys(d.prods).sort().forEach(p => {
      const pd = d.prods[p];
      tableHtml += `<tr>
        <td style="padding-left: 32px;">${p}</td>
        <td>${pd.sumKg}</td><td>${formatCurrency(pd.sumTed)}</td><td>${formatCurrency(pd.sumHal)}</td><td>${formatCurrency(pd.sumFark)}</td>
      </tr>`;
    });
  });
  
  tableHtml += `<tr class="pivot-row-group" style="background: rgba(96, 165, 250, 0.2);">
      <td>Genel Toplam</td>
      <td>${gKg}</td><td>${formatCurrency(gTed)}</td><td>${formatCurrency(gHal)}</td><td>${formatCurrency(gFark)}</td>
    </tr></tbody></table>`;

  viewContent.innerHTML = `
    <div class="pivot-layout">
      <div class="slicer-panel">
        ${renderSlicer('GİTTİĞİ YER', hotels, 'hotel')}
        ${renderSlicer('MÜSTAHSİL', suppliers, 'supplier')}
        ${renderSlicer('MAL', prods, 'product')}
      </div>
      <div class="pivot-table-container glass-panel">
        ${tableHtml}
      </div>
    </div>
  `;
}

window.setPivotFilter = (key, val) => {
  pivotFilters[key] = val;
  renderPivot();
};

// Init
renderDashboard();
