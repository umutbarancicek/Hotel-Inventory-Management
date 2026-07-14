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

window.renderDropdownHtml = (title, items, currentVal, fnName, keyName) => `
    <div class="top-filter-group">
      <label>${title}</label>
      <select onchange="window.${fnName}('${keyName}', this.value === 'Tümü' ? null : this.value)">
        <option value="Tümü" ${currentVal === null ? 'selected' : ''}>Tümü</option>
        ${items.map(i => `<option value="${i}" ${currentVal === i ? 'selected' : ''}>${i}</option>`).join('')}
      </select>
    </div>
`;

let veriFilters = { supplier: null, hotel: null, product: null };
window.setVeriFilter = (key, val) => { veriFilters[key] = val; renderVeri(); };

// Quick entry state
let qeState = {
  date: new Date().toISOString().split('T')[0],
  supplier: null,
  hotel: null,
  selectedProducts: [], // [{product, price, unit}] — user-selected from modal
  kilos: {}             // productName -> kg value
};

function renderVeri() {
  viewTitle.innerText = 'VERİ (İşlemler)';
  const data = DataService.getData();
  const allTxs = data.transactions;
  const latestPrices = DataService.getLatestPrices();

  const suppliers = data.accounts.filter(a => a.type === 'supplier').map(a => a.name).sort();
  const hotels    = data.accounts.filter(a => a.type === 'hotel').map(a => a.name).sort();

  if (!qeState.supplier && suppliers.length > 0) qeState.supplier = suppliers[0];
  if (!qeState.hotel    && hotels.length    > 0) qeState.hotel    = hotels[0];

  const parsePrice = str => typeof str === 'number' ? str : parseFloat(String(str).replace(/\./g,'').replace(',','.')) || 0;

  // Selected product rows (those the user picked from modal)
  const pendingCount = qeState.selectedProducts.filter(p => qeState.kilos[p.product] && Number(qeState.kilos[p.product]) > 0).length;

  const selectedRows = qeState.selectedProducts.map(p => {
    const kilo = qeState.kilos[p.product] || '';
    const priceVal = parsePrice(p.price);
    const total = kilo && Number(kilo) > 0 ? formatCurrency(priceVal * Number(kilo)) : '—';
    const safe = p.product.replace(/'/g,"\\'");
    return `
      <tr class="${kilo && Number(kilo) > 0 ? 'qe-row-active' : ''}">
        <td>
          <button onclick="window.qeRemoveProduct('${safe}')" title="Kaldır"
            style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;padding:0 6px 0 0;">✕</button>
          <strong>${p.product}</strong>
        </td>
        <td style="color:#60a5fa;">${formatCurrency(priceVal)}<span style="opacity:.6;font-size:.8rem"> /${p.unit}</span></td>
        <td style="width:120px;">
          <input type="number" class="qe-table-input" placeholder="kg" value="${kilo}" min="0"
            oninput="window.qeSetKilo('${safe}', this.value)"
            onclick="this.select()">
        </td>
        <td style="color:#10b981;font-weight:700;min-width:110px;">${total}</td>
      </tr>`;
  }).join('');

  // TX list
  const txSuppliers = [...new Set(allTxs.map(t => t.supplier))].sort();
  const txHotels    = [...new Set(allTxs.map(t => t.hotel))].sort();
  const txProds     = [...new Set(allTxs.map(t => t.product))].sort();

  const txs = [...allTxs].filter(t => {
    if (veriFilters.supplier && t.supplier !== veriFilters.supplier) return false;
    if (veriFilters.hotel    && t.hotel    !== veriFilters.hotel)    return false;
    if (veriFilters.product  && t.product  !== veriFilters.product)  return false;
    return true;
  }).reverse();

  const txRows = txs.map(tx => {
    const hal = tx.qty * tx.buyPrice, ted = tx.qty * tx.supplyPrice;
    return `<tr>
      <td>${formatAppDate(tx.date)}</td><td>${tx.supplier}</td><td>${tx.product}</td>
      <td>${tx.qty}</td><td>${tx.hotel}</td>
      <td>${formatCurrency(tx.buyPrice)}</td><td>${formatCurrency(tx.supplyPrice)}</td>
      <td>${formatCurrency(hal)}</td><td>${formatCurrency(ted)}</td>
      <td><span class="${ted-hal>=0?'success':'danger'}">${formatCurrency(ted-hal)}</span></td>
    </tr>`;
  }).join('');

  viewContent.innerHTML = `
    <!-- QUICK ENTRY PANEL -->
    <div class="glass-panel" style="margin-bottom:16px;">
      <!-- TOP BAR: date / supplier / hotel / buttons -->
      <div class="qe-top-bar">
        <span class="qe-top-bar-title"><i class="fa-solid fa-bolt" style="color:#3b82f6;margin-right:8px;"></i>HIZLI VERİ GİRİŞİ</span>
        <div class="qe-controls">
          <div class="top-filter-group">
            <label>TARİH</label>
            <input type="date" value="${qeState.date}" onchange="window.qeSet('date',this.value)"
              style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 12px;font-family:'Outfit',sans-serif;">
          </div>
          <div class="top-filter-group">
            <label>MÜSTAHSİL</label>
            <select onchange="window.qeSet('supplier',this.value)">
              ${suppliers.map(s=>`<option value="${s}" ${qeState.supplier===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="top-filter-group">
            <label>GİTTİĞİ YER</label>
            <select onchange="window.qeSet('hotel',this.value)">
              ${hotels.map(h=>`<option value="${h}" ${qeState.hotel===h?'selected':''}>${h}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;gap:8px;align-self:flex-end;">
            <button onclick="window.qeOpenModal()" class="dash-btn btn-black" style="margin:0;padding:10px 18px;">
              <i class="fa-solid fa-plus"></i> ÜRÜN SEÇ
            </button>
            <button onclick="window.qeSave()" class="dash-btn btn-green" style="margin:0;padding:10px 18px;" ${pendingCount===0?'disabled':''}>
              <i class="fa-solid fa-floppy-disk"></i> KAYDET (${pendingCount})
            </button>
            ${qeState.selectedProducts.length > 0 ? `
            <button onclick="window.qeClear()" title="Listeyi Temizle"
              style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:10px 14px;cursor:pointer;font-family:'Outfit',sans-serif;">
              <i class="fa-solid fa-trash"></i>
            </button>` : ''}
          </div>
        </div>
      </div>

      <!-- SELECTED PRODUCTS TABLE -->
      ${qeState.selectedProducts.length > 0 ? `
        <table class="qe-table" style="margin-top:4px;">
          <thead><tr><th>MAL</th><th>FİYAT</th><th>KİLO</th><th>TUTAR</th></tr></thead>
          <tbody>${selectedRows}</tbody>
        </table>
      ` : `
        <div style="text-align:center;padding:28px;color:#6b7280;">
          <i class="fa-solid fa-box-open" style="font-size:2rem;margin-bottom:12px;display:block;opacity:.4;"></i>
          <span>Henüz ürün seçilmedi. <strong style="color:#3b82f6;cursor:pointer;" onclick="window.qeOpenModal()">Ürün Seç</strong> butonuna basın.</span>
        </div>
      `}
    </div>

    <!-- TX LIST -->
    <div class="glass-panel">
      <div class="top-filter-bar" style="margin-bottom:12px;flex-wrap:wrap;">
        ${renderDropdownHtml('MÜSTAHSİL', txSuppliers, veriFilters.supplier, 'setVeriFilter', 'supplier')}
        ${renderDropdownHtml('GİTTİĞİ YER', txHotels, veriFilters.hotel, 'setVeriFilter', 'hotel')}
        ${renderDropdownHtml('MAL', txProds, veriFilters.product, 'setVeriFilter', 'product')}
      </div>
      <table>
        <thead><tr><th>TARİH</th><th>MÜSTAHSİL</th><th>MAL</th><th>KİLO</th><th>GİTTİĞİ YER</th><th>ALIŞ F.</th><th>TEDA F.</th><th>HAL TUTAR</th><th>TEDARİK</th><th>FARK</th></tr></thead>
        <tbody>${txRows}</tbody>
      </table>
    </div>
  `;
  initTableFeatures();
}

// ── MODAL ─────────────────────────────────────────────────────────────────
window.qeOpenModal = () => {
  const latestPrices = DataService.getLatestPrices();
  if (latestPrices.length === 0) {
    alert('Önce Fiyat Listesi sayfasından TUTED fiyatları çekin.');
    return;
  }
  const selectedSet = new Set(qeState.selectedProducts.map(p => p.product));

  const chips = latestPrices.map(p => {
    const sel = selectedSet.has(p.product);
    return `<div class="modal-chip ${sel?'modal-chip-sel':''}" data-product="${p.product}" onclick="window.qeToggleChip(this,'${p.product.replace(/'/g,"\\'")}')">
      ${p.product}
    </div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'qe-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this) window.qeCloseModal()">
      <div class="modal-box">
        <div class="modal-header">
          <span><i class="fa-solid fa-list-check" style="margin-right:8px;color:#3b82f6;"></i>Ürün Seç</span>
          <button onclick="window.qeCloseModal()" style="background:none;border:none;color:#9ca3af;font-size:1.4rem;cursor:pointer;line-height:1;">✕</button>
        </div>
        <input type="text" id="modal-search" placeholder="Ürün ara..." oninput="window.qeModalSearch(this.value)"
          style="width:100%;box-sizing:border-box;padding:10px 14px;background:rgba(255,255,255,0.08);border:1px solid var(--panel-border);border-radius:8px;color:white;font-family:'Outfit',sans-serif;font-size:.95rem;margin-bottom:14px;outline:none;">
        <div class="modal-chips" id="modal-chips">${chips}</div>
        <div class="modal-footer">
          <span id="modal-sel-count" style="color:#9ca3af;font-size:.9rem;">${selectedSet.size} seçili</span>
          <button onclick="window.qeConfirmModal()" class="dash-btn btn-green" style="margin:0;padding:10px 24px;">
            Tamam
          </button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('modal-search').focus();
};

window.qeToggleChip = (el, product) => {
  el.classList.toggle('modal-chip-sel');
  const count = document.querySelectorAll('.modal-chip-sel').length;
  const counter = document.getElementById('modal-sel-count');
  if (counter) counter.textContent = `${count} seçili`;
};

window.qeModalSearch = (val) => {
  const q = val.toLowerCase();
  document.querySelectorAll('.modal-chip').forEach(c => {
    c.style.display = c.dataset.product.toLowerCase().includes(q) ? '' : 'none';
  });
};

window.qeCloseModal = () => {
  const m = document.getElementById('qe-modal');
  if (m) m.remove();
};

window.qeConfirmModal = () => {
  const latestPrices = DataService.getLatestPrices();
  const priceMap = {};
  latestPrices.forEach(p => { priceMap[p.product] = p; });

  const selected = [...document.querySelectorAll('.modal-chip-sel')].map(c => c.dataset.product);
  // Keep existing kilos for already-selected products; add new ones
  const newSelected = selected.map(name => priceMap[name]).filter(Boolean);
  // Remove kilos for deselected products
  const newSelectedNames = new Set(newSelected.map(p => p.product));
  Object.keys(qeState.kilos).forEach(k => { if (!newSelectedNames.has(k)) delete qeState.kilos[k]; });
  qeState.selectedProducts = newSelected;
  window.qeCloseModal();
  renderVeri();
  // Focus first kilo input
  setTimeout(() => { const first = document.querySelector('.qe-table-input'); if (first) first.focus(); }, 100);
};

window.qeSet = (key, val) => { qeState[key] = val; renderVeri(); };

window.qeSetKilo = (product, val) => {
  qeState.kilos[product] = val;
  // Update total cell in-place
  const rows = document.querySelectorAll('.qe-table tbody tr');
  rows.forEach(row => {
    const nameCell = row.cells[0];
    if (!nameCell || !nameCell.textContent.trim().includes(product)) return;
    const kilo = Number(val);
    row.classList.toggle('qe-row-active', kilo > 0);
    const totalCell = row.cells[3];
    if (!totalCell) return;
    if (kilo > 0) {
      const priceCell = row.cells[1];
      const pt = priceCell ? priceCell.innerText.replace(/[₺\s]/g,'').replace(/\./g,'').replace(',','.') : '0';
      totalCell.textContent = formatCurrency((parseFloat(pt)||0) * kilo);
      totalCell.style.color = '#10b981';
    } else {
      totalCell.textContent = '—';
    }
  });
  // Update save button count
  const pending = qeState.selectedProducts.filter(p => qeState.kilos[p.product] && Number(qeState.kilos[p.product]) > 0).length;
  const btn = document.querySelector('.dash-btn.btn-green');
  if (btn) { btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> KAYDET (${pending})`; btn.disabled = pending===0; }
};

window.qeRemoveProduct = (product) => {
  qeState.selectedProducts = qeState.selectedProducts.filter(p => p.product !== product);
  delete qeState.kilos[product];
  renderVeri();
};

window.qeSave = () => {
  const priceMap = {};
  qeState.selectedProducts.forEach(p => { priceMap[p.product] = p; });
  let saved = 0;
  Object.entries(qeState.kilos).forEach(([product, kiloStr]) => {
    const kilo = Number(kiloStr);
    if (!kilo || kilo <= 0) return;
    const p = priceMap[product];
    const buyPrice = p ? (typeof p.price==='number' ? p.price : parseFloat(String(p.price).replace(/\./g,'').replace(',','.'))) : 0;
    DataService.addTransaction({ date: qeState.date, supplier: qeState.supplier, hotel: qeState.hotel, product, qty: kilo, adet: '-', buyPrice, supplyPrice: buyPrice });
    saved++;
  });
  qeState.kilos = {};
  qeState.selectedProducts = [];
  renderVeri();
  renderDashboard();
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:32px;right:32px;background:#10b981;color:white;padding:16px 24px;border-radius:12px;font-weight:700;font-family:Outfit,sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
  toast.innerHTML = `<i class="fa-solid fa-check" style="margin-right:8px;"></i>${saved} kalem kaydedildi!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

window.qeClear = () => { qeState.kilos = {}; qeState.selectedProducts = []; renderVeri(); };




let odemeFilters = { account: null };
window.setOdemeFilter = (key, val) => { odemeFilters[key] = val; renderOdemeler(); };

function renderOdemeler() {
  viewTitle.innerText = 'ÖDEMELER';
  const allPy = DataService.getData().payments;
  
  const accounts = [...new Set(allPy.map(p => p.account))].sort();
  
  const py = allPy.filter(p => {
    if (odemeFilters.account && p.account !== odemeFilters.account) return false;
    return true;
  });

  let html = `
    <div class="top-filter-bar glass-panel" style="margin-bottom: 16px;">
      ${renderDropdownHtml('CARİ ADI', accounts, odemeFilters.account, 'setOdemeFilter', 'account')}
    </div>
    <table>
    <thead><tr><th>TARİH</th><th>CARİ ADI</th><th>ÖDEME TUTARI</th><th>AÇIKLAMA</th></tr></thead>
    <tbody>`;
  py.reverse().forEach(p => {
    html += `<tr><td>${formatAppDate(p.date)}</td><td>${p.account}</td><td>${formatCurrency(p.amount)}</td><td>${p.description}</td></tr>`;
  });
  html += `</tbody></table>`;
  viewContent.innerHTML = html;
  initTableFeatures();
}

let selectedFiyatDate = null;

function renderFiyat() {
  viewTitle.innerText = 'FİYAT LİSTESİ';
  const data = DataService.getData();
  const priceLists = data.priceLists || {};
  // Fallback: if no priceLists yet but old prices[] exist
  if (Object.keys(priceLists).length === 0 && data.prices && data.prices.length > 0) {
    const fallbackDate = data.prices[0].date || new Date().toISOString().split('T')[0];
    priceLists[fallbackDate] = data.prices;
  }

  const sortedDates = Object.keys(priceLists).sort((a, b) => b.localeCompare(a));

  if (!selectedFiyatDate || !priceLists[selectedFiyatDate]) {
    selectedFiyatDate = sortedDates[0] || null;
  }

  const currentList = selectedFiyatDate ? priceLists[selectedFiyatDate] : [];

  const dateCards = sortedDates.map(d => `
    <div class="price-date-card ${d === selectedFiyatDate ? 'active' : ''}" onclick="window.selectFiyatDate('${d}')">
      <i class="fa-solid fa-calendar-days"></i>
      <div>
        <div class="pdc-label">TUTED</div>
        <div class="pdc-date">${formatAppDate(d)}</div>
        <div class="pdc-count">${priceLists[d].length} ürün</div>
      </div>
    </div>
  `).join('');

  let tableHtml = '';
  if (currentList.length > 0) {
    tableHtml = `<table>
    <thead><tr><th>MAL</th><th>BİRİM</th><th>FİYAT</th></tr></thead>
    <tbody>`;
    currentList.forEach(p => {
      let priceVal = p.price;
      if (typeof priceVal === 'string') {
        priceVal = parseFloat(priceVal.replace(/\./g, '').replace(',', '.'));
      }
      if (isNaN(priceVal)) priceVal = 0;
      tableHtml += `<tr><td>${p.product}</td><td>${p.unit}</td><td>${formatCurrency(priceVal)}</td></tr>`;
    });
    tableHtml += `</tbody></table>`;
  } else {
    tableHtml = `<p style="text-align:center;padding:40px;color:#9ca3af;">Henüz fiyat listesi çekilmemiş.<br><br>Fiyat Listesi sayfasından <strong>GÜNLÜK FİYATLARI ÇEK (TUTED)</strong> butonuna basin.</p>`;
  }

  viewContent.innerHTML = `
    <div class="fiyat-archive-layout">
      <div class="fiyat-date-panel glass-panel">
        <div style="font-weight:700;font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">FİYAT LİSTESİ ARŞİVİ</div>
        ${sortedDates.length > 0 ? dateCards : '<p style="color:#9ca3af;font-size:0.85rem;">Henüz kayıt yok</p>'}
      </div>
      <div class="fiyat-table-panel glass-panel">
        ${selectedFiyatDate ? `<h3 style="margin-bottom:16px;">TUTED — ${formatAppDate(selectedFiyatDate)} Fiyatları</h3>` : ''}
        ${tableHtml}
      </div>
    </div>
  `;
  initTableFeatures();
}

window.selectFiyatDate = (d) => {
  selectedFiyatDate = d;
  renderFiyat();
};

let ozetFilters = { type: null, dateFrom: null, dateTo: null };
window.setOzetFilter = (key, val) => { ozetFilters[key] = val; renderOzet(); };

function renderOzet() {
  viewTitle.innerText = 'CARİ HESAP ÖZETLERİ';

  // Default: current month
  if (!ozetFilters.dateFrom) {
    const now = new Date();
    ozetFilters.dateFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    ozetFilters.dateTo = now.toISOString().split('T')[0];
  }

  const allBalances = DataService.getAccountBalances(ozetFilters.dateFrom, ozetFilters.dateTo);
  const types = ['Tedarikçi', 'Müşteri'];
  
  const balances = allBalances.filter(b => {
    if (b.totalBought === 0 && b.totalPaid === 0) return false; // hide empty
    const tName = b.type === 'supplier' ? 'Tedarikçi' : 'Müşteri';
    if (ozetFilters.type && tName !== ozetFilters.type) return false;
    return true;
  });

  let html = `
    <div class="top-filter-bar glass-panel" style="margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
      ${renderDropdownHtml('CARİ TİPİ', types, ozetFilters.type, 'setOzetFilter', 'type')}
      <div class="top-filter-group">
        <label>BAŞLA</label>
        <input type="date" id="ozet-from" value="${ozetFilters.dateFrom}" onchange="window.setOzetFilter('dateFrom', this.value)" style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 12px;font-family:'Outfit',sans-serif;cursor:pointer;">
      </div>
      <div class="top-filter-group">
        <label>BİTİŞ</label>
        <input type="date" id="ozet-to" value="${ozetFilters.dateTo}" onchange="window.setOzetFilter('dateTo', this.value)" style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 12px;font-family:'Outfit',sans-serif;cursor:pointer;">
      </div>
      <div class="top-filter-group">
        <label>&nbsp;</label>
        <button onclick="window.setOzetFilter('dateFrom', null); ozetFilters.dateFrom = null; renderOzet();" style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 14px;cursor:pointer;font-family:'Outfit',sans-serif;">Tüm Zamanlar</button>
      </div>
    </div>
    <table>
    <thead><tr><th>CARİ TİPİ</th><th>CARİ ADI</th><th>İŞLEM HACMİ</th><th>ÖDENEN</th><th>BAKİYE</th></tr></thead>
    <tbody>`;
  balances.forEach(b => {
    html += `<tr>
      <td>${b.type === 'supplier' ? 'Tedarikçi' : 'Müşteri'}</td>
      <td><strong>${b.name}</strong></td>
      <td>${formatCurrency(b.totalBought)}</td>
      <td>${formatCurrency(b.totalPaid)}</td>
      <td><span class="${b.balance >= 0 ? 'success' : 'danger'}">${formatCurrency(b.balance)}</span></td>
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
  
  const renderDropdownSlicer = (title, items, key) => `
    <div class="top-filter-group">
      <label>${title}</label>
      <select onchange="window.setPivotFilter('${key}', this.value === 'Tümü' ? null : this.value)">
        <option value="Tümü" ${pivotFilters[key] === null ? 'selected' : ''}>Tümü</option>
        ${items.map(i => `<option value="${i}" ${pivotFilters[key] === i ? 'selected' : ''}>${i}</option>`).join('')}
      </select>
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
    <div class="pivot-layout-new">
      <div class="top-filter-bar glass-panel">
        ${renderDropdownSlicer('GİTTİĞİ YER', hotels, 'hotel')}
        ${renderDropdownSlicer('MÜSTAHSİL', suppliers, 'supplier')}
        ${renderDropdownSlicer('MAL', prods, 'product')}
      </div>
      <div class="pivot-table-container glass-panel" style="margin-top:0;">
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
       const indexUrl = 'https://proxy.cors.sh/https://antalyatuted.org.tr/Fiyat/Index';
       const response = await fetch(indexUrl);
       if (!response.ok) throw new Error('Ağa bağlanılamadı');
       const htmlText = await response.text();
       
       // 2. Find excel link
       const match = htmlText.match(/href="(\/Fiyat\/Index\?p=excel&id=\d+)"/);
       if (!match) throw new Error('Güncel Excel dosyası bulunamadı!');
       const targetExcelUrl = 'https://antalyatuted.org.tr' + match[1];
       const excelUrl = 'https://proxy.cors.sh/' + targetExcelUrl;
       
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
       
       // 6. Save as archive snapshot & compute changes vs latest list
       const prevPrices = DataService.getLatestPrices();
       const prevMap = {};
       prevPrices.forEach(p => { prevMap[p.product.trim()] = p; });

       const changes = [];
       newPrices.forEach(np => {
           const prev = prevMap[np.product];
           const parseP = (str) => {
               if (typeof str === 'number') return str;
               return parseFloat(String(str).replace(/\./g, '').replace(',', '.'));
           };
           if (!prev) {
               changes.push(`- [YENİ] ${np.product} eklendi: ₺${np.price}`);
           } else if (parseP(prev.price) !== parseP(np.price)) {
               changes.push(`- [GÜNCELLENDİ] ${np.product}: ₺${prev.price} → ₺${np.price}`);
           }
       });

       // Save snapshot — always saves even if no changes (new date = new archive entry)
       DataService.savePriceList(listDateStr, newPrices);
       selectedFiyatDate = listDateStr; // auto-select the new date

       if (changes.length === 0) {
           alert(`${formatAppDate(listDateStr)} tarihli fiyatlar arşive kaydedildi. Fiyatlarda değişiklik yok.`);
       } else {
           alert(`Başarılı! ${formatAppDate(listDateStr)} tarihli liste arşive kaydedildi.\n\nDeğişiklikler:\n${changes.slice(0, 20).join('\n')}${changes.length > 20 ? `\n... ve ${changes.length - 20} değişiklik daha` : ''}`);
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


