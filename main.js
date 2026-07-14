import * as XLSX from 'xlsx';
import './style.css';
import { DataService } from './dataService.js';

// AUTHENTICATION LOGIC
const appContainer = document.getElementById('app');
const loginContainer = document.getElementById('login-container');
const btnLogin = document.getElementById('btn-login');

async function checkAuthAndInit() {
  if (sessionStorage.getItem('otel_auth') === 'true') {
    appContainer.style.display = 'none'; // hide until loaded
    loginContainer.style.display = 'none';
    
    await DataService.init();
    
    appContainer.style.display = 'block';
    renderDashboard();
  } else {
    appContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
  }
}
checkAuthAndInit();

btnLogin.addEventListener('click', async () => {
  const id = document.getElementById('login-id').value;
  const pass = document.getElementById('login-pass').value;
  
  if (id === 'mcakir' && pass === '1234') {
    btnLogin.innerText = 'Yükleniyor...';
    btnLogin.disabled = true;
    
    await DataService.init();
    
    sessionStorage.setItem('otel_auth', 'true');
    appContainer.style.display = 'block';
    loginContainer.style.display = 'none';
    document.getElementById('login-error').style.display = 'none';
    
    btnLogin.innerText = 'Giriş Yap';
    btnLogin.disabled = false;
    renderDashboard();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
});

document.getElementById('login-pass').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.removeItem('otel_auth');
  window.location.reload();
});

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
    adet: document.getElementById('q-v-adet').value || '-',
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
    
    // Manage fetch button visibility
    const tutedBtn = document.getElementById('btn-fetch-tuted');
    tutedBtn.style.display = nav === 'fiyat' ? 'block' : 'none';
    
    if (nav === 'veri') renderVeri();
    else if (nav === 'odemeler') renderOdemeler();
    else if (nav === 'fiyat') renderFiyat();
    else if (nav === 'pivot') renderPivot();
    else if (nav === 'ozet') renderOzet();
    else if (nav === 'sevk') renderSevk();
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
    <thead><tr><th>TARİH</th><th>MÜSTAHSİL</th><th>MAL</th><th>KİLO</th><th>GİTTİĞİ YER</th><th>ADET (TÜTED)</th><th>ALIŞ FİAT</th><th>TEDA FİAT</th><th>HAL TUTAR</th><th>TEDARİK TUTAR</th><th>FARK</th></tr></thead>
    <tbody>`;
  txs.reverse().forEach(tx => {
    const hal = tx.qty * tx.buyPrice;
    const ted = tx.qty * tx.supplyPrice;
    html += `<tr>
      <td>${formatAppDate(tx.date)}</td><td>${tx.supplier}</td><td>${tx.product}</td><td>${tx.qty}</td><td>${tx.hotel}</td><td>${tx.adet || '-'}</td>
      <td>${formatCurrency(tx.buyPrice)}</td><td>${formatCurrency(tx.supplyPrice)}</td>
      <td>${formatCurrency(hal)}</td><td>${formatCurrency(ted)}</td>
      <td><span class="${ted-hal >= 0 ? 'success' : 'danger'}">${formatCurrency(ted-hal)}</span></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  viewContent.innerHTML = html;
  initTableFeatures();
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
  initTableFeatures();
}

function renderFiyat() {
  viewTitle.innerText = 'FİYAT LİSTESİ';
  const pr = DataService.getData().prices;
  let html = `<table>
    <thead><tr><th>TARİH</th><th>MAL</th><th>BİRİM</th><th>FİYAT</th></tr></thead>
    <tbody>`;
  pr.forEach(p => {
    let priceVal = p.price;
    if (typeof priceVal === 'string') {
      priceVal = parseFloat(priceVal.replace(/\./g, '').replace(',', '.'));
    }
    if (isNaN(priceVal)) priceVal = 0;
    html += `<tr><td>${formatAppDate(p.date)}</td><td>${p.product}</td><td>${p.unit}</td><td>${formatCurrency(priceVal)}</td></tr>`;
  });
  html += `</tbody></table>`;
  viewContent.innerHTML = html;
  initTableFeatures();
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
  initTableFeatures();
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
    ...txs.map(t => ({ 
      date: t.date, 
      desc: `${t.qty} Kg ${t.product} (${formatCurrency(acc.type === 'supplier' ? t.buyPrice : t.supplyPrice)}/Kg)`, 
      amount: acc.type === 'supplier' ? (t.qty*t.buyPrice) : (t.qty*t.supplyPrice), 
      type: 'Alım/Satım' 
    })),
    ...pms.map(p => ({ date: p.date, desc: p.description, amount: p.amount, type: 'Ödeme' }))
  ].sort((a,b) => new Date(b.date) - new Date(a.date));
  
  allEvents.forEach(e => {
    html += `<tr><td>${formatAppDate(e.date)}</td><td>${e.desc}</td><td>${formatCurrency(e.amount)}</td><td>${e.type}</td></tr>`;
  });
  
  html += `</tbody></table>`;
  viewContent.innerHTML = html;
  initTableFeatures();
}

let sevkDate = new Date().toISOString().split('T')[0];
function renderSevk() {
  viewTitle.innerText = 'SEVK RAPORU';
  const data = DataService.getData();
  
  // Filter by date
  const filtered = data.transactions.filter(t => t.date === sevkDate);
  
  // Group by Hotel -> Product
  const grouped = {};
  filtered.forEach(t => {
    if (!grouped[t.hotel]) grouped[t.hotel] = { sumKg: 0, sumTed: 0, sumHal: 0, prods: {} };
    if (!grouped[t.hotel].prods[t.product]) grouped[t.hotel].prods[t.product] = { sumKg: 0, sumTed: 0, sumHal: 0 };
    
    const hal = t.qty * t.buyPrice;
    const ted = t.qty * t.supplyPrice;
    
    grouped[t.hotel].prods[t.product].sumKg += t.qty;
    grouped[t.hotel].prods[t.product].sumHal += hal;
    grouped[t.hotel].prods[t.product].sumTed += ted;
    
    grouped[t.hotel].sumKg += t.qty;
    grouped[t.hotel].sumHal += hal;
    grouped[t.hotel].sumTed += ted;
  });
  
  let html = `
    <div style="margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; display: flex; align-items: center; gap: 16px;">
       <strong>Rapor Tarihi Seçin:</strong>
       <input type="date" id="sevk-date-picker" value="${sevkDate}" class="form-control" style="max-width: 200px; padding: 10px; background: rgba(255,255,255,0.1); color: white; border: 1px solid var(--panel-border); border-radius: 6px;">
       <button id="btn-sevk-filter" class="dash-btn btn-green" style="margin-bottom: 0;"><i class="fa-solid fa-filter"></i> Raporu Getir</button>
    </div>
  `;
  
  if (Object.keys(grouped).length === 0) {
     html += `<p style="text-align: center; padding: 40px; color: #9ca3af; font-size: 1.1rem;">${formatAppDate(sevkDate)} tarihinde herhangi bir sevkiyat (işlem) bulunmamaktadır.</p>`;
     viewContent.innerHTML = html;
  } else {
     html += `<table>
       <thead>
         <tr><th>Satır Etiketleri</th><th>Toplam KİLO</th><th>Toplam TEDARİK</th><th>Toplam HAL</th><th>Toplam FARK</th></tr>
       </thead>
       <tbody>
     `;
     
     let gKg = 0, gHal = 0, gTed = 0;
     
     Object.keys(grouped).sort().forEach(h => {
       const d = grouped[h];
       const hFark = d.sumTed - d.sumHal;
       gKg += d.sumKg; gHal += d.sumHal; gTed += d.sumTed;
       
       html += `<tr class="pivot-row-group">
         <td><i class="fa-solid fa-hotel" style="margin-right: 8px;"></i> ${h}</td>
         <td>${d.sumKg}</td><td>${formatCurrency(d.sumTed)}</td><td>${formatCurrency(d.sumHal)}</td><td><span class="${hFark >= 0 ? 'success' : 'danger'}">${formatCurrency(hFark)}</span></td>
       </tr>`;
       
       Object.keys(d.prods).sort().forEach(p => {
         const pd = d.prods[p];
         const pFark = pd.sumTed - pd.sumHal;
         html += `<tr>
           <td style="padding-left: 32px;"><i class="fa-solid fa-angle-right" style="font-size: 0.8rem; opacity: 0.5; margin-right: 6px;"></i> ${p}</td>
           <td>${pd.sumKg}</td><td>${formatCurrency(pd.sumTed)}</td><td>${formatCurrency(pd.sumHal)}</td><td><span class="${pFark >= 0 ? 'success' : 'danger'}">${formatCurrency(pFark)}</span></td>
         </tr>`;
       });
     });
     
     const gFark = gTed - gHal;
     html += `<tr class="pivot-row-group" style="background: rgba(96, 165, 250, 0.2);">
         <td>GENEL TOPLAM</td>
         <td>${gKg}</td><td>${formatCurrency(gTed)}</td><td>${formatCurrency(gHal)}</td><td><span class="${gFark >= 0 ? 'success' : 'danger'}">${formatCurrency(gFark)}</span></td>
       </tr></tbody></table>`;
     
     viewContent.innerHTML = html;
     initTableFeatures();
  }
  
  // Attach event listener
  setTimeout(() => {
     const btn = document.getElementById('btn-sevk-filter');
     if (btn) {
         btn.onclick = () => {
             sevkDate = document.getElementById('sevk-date-picker').value;
             renderSevk();
         };
     }
  }, 50);
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

// Init is now handled in checkAuthAndInit at the top.

function initTableFeatures() {
   const container = document.getElementById('view-content');
   const table = container.querySelector('table');
   if(!table) return;
   
   if(!document.getElementById('table-search-box')) {
      const searchBox = document.createElement('input');
      searchBox.id = 'table-search-box';
      searchBox.placeholder = 'Tabloda ara...';
      searchBox.className = 'table-search';
      searchBox.onkeyup = function(e) {
         const val = e.target.value.toLowerCase();
         const rows = table.querySelectorAll('tbody tr:not(.pivot-row-group)');
         rows.forEach(r => {
             const text = r.innerText.toLowerCase();
             r.style.display = text.includes(val) ? '' : 'none';
         });
      };
      table.parentNode.insertBefore(searchBox, table);
   }

   const ths = table.querySelectorAll('th');
   ths.forEach((th, idx) => {
       th.onclick = () => {
          const tbody = table.querySelector('tbody');
          const rows = Array.from(tbody.querySelectorAll('tr:not(.pivot-row-group)'));
          
          let isAsc = th.classList.contains('asc');
          ths.forEach(t => t.classList.remove('asc', 'desc'));
          th.classList.add(isAsc ? 'desc' : 'asc');
          
          rows.sort((a, b) => {
             let valA = a.cells[idx].innerText.trim();
             let valB = b.cells[idx].innerText.trim();
             
             let numA = parseFloat(valA.replace(/[₺. ]/g, '').replace(',','.'));
             let numB = parseFloat(valB.replace(/[₺. ]/g, '').replace(',','.'));
             
             if (valA.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                numA = parseInt(valA.split('.').reverse().join(''));
                numB = parseInt(valB.split('.').reverse().join(''));
             }

             if(!isNaN(numA) && !isNaN(numB)) {
                 return isAsc ? numB - numA : numA - numB;
             }
             return isAsc ? valB.localeCompare(valA) : valA.localeCompare(valB);
          });
          
          rows.forEach(r => tbody.appendChild(r));
       };
   });
}

// TUTED FETCH LOGIC
document.getElementById('btn-fetch-tuted').addEventListener('click', async (e) => {
   const btn = e.target;
   const originalText = btn.innerHTML;
   btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Lütfen bekleyin, veriler çekiliyor...';
   btn.disabled = true;
   
   try {
       // 1. Fetch index page using cors proxy to bypass CORS on GitHub Pages
       const indexUrl = 'https://corsproxy.io/?https://antalyatuted.org.tr/Fiyat/Index';
       const response = await fetch(indexUrl);
       if (!response.ok) throw new Error('Ağa bağlanılamadı');
       const htmlText = await response.text();
       
       // 2. Find excel link
       const match = htmlText.match(/href="(\/Fiyat\/Index\?p=excel&id=\d+)"/);
       if (!match) throw new Error('Güncel Excel dosyası bulunamadı!');
       const excelUrl = 'https://corsproxy.io/?https://antalyatuted.org.tr' + match[1];
       
       // 3. Fetch excel file
       const excelRes = await fetch(excelUrl);
       if (!excelRes.ok) throw new Error('Excel dosyası indirilemedi');
       const arrayBuffer = await excelRes.arrayBuffer();
       
       // 4. Parse with XLSX
       const wb = XLSX.read(arrayBuffer, {type: 'array'});
       const sheetName = wb.SheetNames[0];
       const sheet = wb.Sheets[sheetName];
       const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
       
       // 5. Extract prices
       // Try to extract date from the first row (e.g., '13.07.2026 Antalya...')
       let listDateStr = new Date().toISOString().split('T')[0];
       if (data[0] && data[0][0]) {
           const dMatch = data[0][0].toString().match(/(\d{2})\.(\d{2})\.(\d{4})/);
           if (dMatch) listDateStr = `${dMatch[3]}-${dMatch[2]}-${dMatch[1]}`;
       }
       
       const newPrices = [];
       for (let i = 2; i < data.length; i++) {
           const row = data[i];
           if (!row || !row[2] || !row[3] || !row[4]) continue;
           newPrices.push({
               date: listDateStr,
               product: row[2].trim(),
               unit: row[3],
               price: row[4].toString().trim()
           });
       }
       
       if (newPrices.length === 0) throw new Error('Excel dosyasının içinde fiyat verisi bulunamadı.');
       
       // 6. Merge with existing data
       const appData = DataService.getData();
       const currentPrices = appData.prices || [];
       const changes = [];
       let addedCount = 0;
       
       newPrices.forEach(np => {
           const existingIndex = currentPrices.findIndex(cp => cp.product.trim() === np.product);
           
           if (existingIndex === -1) {
               // New product
               currentPrices.push(np);
               changes.push(`- [YENİ] ${np.product} eklendi: ₺${np.price}`);
               addedCount++;
           } else {
               // Existing product
               const oldP = currentPrices[existingIndex].price;
               const newP = np.price;
               
               // Compare numerically
               const parseP = (str) => {
                 if (typeof str === 'number') return str;
                 return parseFloat(str.replace(/\./g, '').replace(',', '.'));
               };
               
               if (parseP(oldP) !== parseP(newP)) {
                   changes.push(`- [GÜNCELLENDİ] ${np.product}: ₺${oldP} -> ₺${newP}`);
                   currentPrices[existingIndex].price = newP;
                   currentPrices[existingIndex].date = np.date;
               }
           }
       });
       
       appData.prices = currentPrices;
       DataService.saveData(appData);
       
       if (changes.length === 0 && addedCount === 0) {
           alert(`${formatAppDate(listDateStr)} tarihli güncel fiyatlar çekildi. Ancak fiyatlarda hiçbir değişiklik yok!`);
       } else {
           alert(`Başarılı! ${formatAppDate(listDateStr)} tarihli liste işlendi.\n\nDeğişiklikler:\n${changes.join('\n')}`);
       }
       
       renderFiyat();
       renderDashboard(); // Re-render selects etc
   } catch (err) {
       alert('Hata: ' + err.message);
       console.error(err);
   } finally {
       btn.innerHTML = originalText;
       btn.disabled = false;
   }
});
