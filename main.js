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
    
    appContainer.style.display = 'flex';
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
    appContainer.style.display = 'flex';
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
    else if (nav === 'sevk') renderPivot();
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
  kilos: {}, overridePrices: {}
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
  const pendingCount = qeState.selectedProducts.filter(p => qeState.kilos[p.product] && (parseFloat(String(qeState.kilos[p.product]).replace(',','.'))||0) > 0).length;

  const selectedRows = qeState.selectedProducts.map(p => {
    const kilo = qeState.kilos[p.product] || '';
    const ov = qeState.overridePrices[p.product] || {};
    const buyVal = ov.buy !== undefined ? ov.buy : parsePrice(p.price);
    const supplyVal = ov.supply !== undefined ? ov.supply : parsePrice(p.price);
    const hal = kilo && (parseFloat(String(kilo).replace(',','.'))||0) > 0 ? formatCurrency(buyVal * (parseFloat(String(kilo).replace(',','.'))||0)) : '—';
    const ted = kilo && (parseFloat(String(kilo).replace(',','.'))||0) > 0 ? formatCurrency(supplyVal * (parseFloat(String(kilo).replace(',','.'))||0)) : '—';
    const fark = (kilo && (parseFloat(String(kilo).replace(',','.'))||0) > 0) ? formatCurrency((supplyVal - buyVal) * (parseFloat(String(kilo).replace(',','.'))||0)) : '—';
    const safe = p.product.replace(/'/g,"\\'");
    return `
      <tr class="${kilo && (parseFloat(String(kilo).replace(',','.'))||0) > 0 ? 'qe-row-active' : ''}">
        <td>
          <button onclick="window.qeRemoveProduct('${safe}')" title="Kaldır"
            style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;padding:0 6px 0 0;">✕</button>
          <strong>${p.product}</strong>
        </td>
        <td style="width:90px;">
          <input type="number" style="width:80px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:white;padding:4px 6px;font-family:Outfit,sans-serif;font-size:.85rem;" placeholder="Alış ₺" value="${buyVal}"
            oninput="window.qeSetPrice('${safe}','buy',this.value)" onclick="this.select()">
        </td>
        <td style="width:90px;">
          <input type="number" style="width:80px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:white;padding:4px 6px;font-family:Outfit,sans-serif;font-size:.85rem;" placeholder="Tedarik ₺" value="${supplyVal}"
            oninput="window.qeSetPrice('${safe}','supply',this.value)" onclick="this.select()">
        </td>
        <td style="width:100px;">
          <input type="number" class="qe-table-input" placeholder="kg" value="${kilo}" min="0"
            oninput="window.qeSetKilo('${safe}', this.value)"
            onclick="this.select()">
        </td>
        <td style="color:#60a5fa;font-weight:700;min-width:90px;">${hal}</td>
        <td style="color:#10b981;font-weight:700;min-width:90px;">${ted}</td>
        <td style="color:${fark==='—'?'#9ca3af':(supplyVal>=buyVal?'#10b981':'#ef4444')};font-weight:700;min-width:80px;">${fark}</td>
      </tr>`;
  }).join('');

  // TX list
  const txSuppliers = [...new Set(allTxs.map(t => (t.supplier||'').trim()))].sort();
  const txHotels    = [...new Set(allTxs.map(t => (t.hotel||'').trim()))].sort();
  const txProds     = [...new Set(allTxs.map(t => (t.product||'').trim()))].sort();

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
      <td style="white-space:nowrap;">
        <button onclick="window.editTransaction(${tx.id})" title="Düzenle" style="background:rgba(96,165,250,.15);color:#60a5fa;border:1px solid rgba(96,165,250,.3);border-radius:6px;padding:4px 8px;cursor:pointer;margin-right:4px;"><i class="fa-solid fa-pen"></i></button>
        <button onclick="window.deleteTransaction(${tx.id})" title="Sil" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:6px;padding:4px 8px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
      </td>
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
          <thead><tr><th>MAL</th><th>ALIŞ F.</th><th>TEDARİK F.</th><th>KİLO</th><th>HAL TUTAR</th><th>TEDARİK</th><th>FARK</th></tr></thead>
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
        <thead><tr><th>TARİH</th><th>MÜSTAHSİL</th><th>MAL</th><th>KİLO</th><th>GİTTİĞİ YER</th><th>ALIŞ F.</th><th>TEDA F.</th><th>HAL TUTAR</th><th>TEDARİK</th><th>FARK</th><th>İŞLEM</th></tr></thead>
        <tbody>${txRows}</tbody>
      </table>
    </div>
  `;
  initTableFeatures();
}

// ── MODAL ─────────────────────────────────────────────────────────────────
window.qeOpenModal = () => {
  const data = DataService.getData();
  const priceList = qeState.priceDate ? (data.priceLists[qeState.priceDate] || data.prices || []) : (data.prices || []);
  const selectedSet = new Set(qeState.selectedProducts.map(p => p.product));

  const chips = priceList.map(p => {
    const sel = selectedSet.has(p.product);
    return `<div class="modal-chip ${sel?'modal-chip-sel':''}" data-product="${p.product}" onclick="window.qeToggleChip(this,'${p.product.replace(/'/g,"\\'")}')">${p.product}</div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'qe-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this) window.qeCloseModal()">
      <div class="modal-box">
        <div class="modal-header">
          <span><i class="fa-solid fa-list-check" style="margin-right:8px;color:#3b82f6;"></i>Ürün Seç</span>
          <button onclick="window.qeCloseModal()" style="background:none;border:none;color:#9ca3af;font-size:1.4rem;cursor:pointer;line-height:1;">&times;</button>
        </div>
        <div style="display:flex; gap:8px; margin-bottom:14px;">
          <input type="text" id="modal-search" placeholder="Ürün ara..." oninput="window.qeModalSearch(this.value)" style="flex:1;box-sizing:border-box;padding:10px 14px;background:rgba(255,255,255,0.08);border:1px solid var(--panel-border);border-radius:8px;color:white;font-family:'Outfit',sans-serif;font-size:.95rem;outline:none;">
          <button onclick="window.qeAddManualProduct()" style="background:rgba(59, 130, 246, 0.2);color:#3b82f6;border:1px solid #3b82f6;border-radius:8px;padding:0 14px;cursor:pointer;font-weight:bold;white-space:nowrap;">Manuel Ekle</button>
        </div>
        <div class="modal-chips" id="modal-chips">${chips || '<p style="color:#9ca3af;font-size:0.9rem;text-align:center;width:100%;padding:10px;">Fiyat listesi boş. Lütfen "Fiyat Listesi" sekmesinden fiyatları çekin veya manuel ürün ekleyin.</p>'}</div>
        <div class="modal-footer">
          <span id="modal-sel-count" style="color:#9ca3af;font-size:.9rem;">${selectedSet.size} seçili</span>
          <button onclick="window.qeConfirmModal()" class="dash-btn btn-green" style="margin:0;padding:10px 24px;">Tamam</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('modal-search').focus();
};

window.qeAddManualProduct = () => {
  const searchInput = document.getElementById('modal-search');
  const val = searchInput.value.trim().toUpperCase();
  if (!val) {
    alert("Lütfen eklenecek ürün adını yazın!");
    return;
  }
  
  const existing = qeState.selectedProducts.find(p => p.product === val);
  if (!existing) {
    qeState.selectedProducts.push({ product: val, price: 0, unit: 'KG' });
  }
  
  window.qeCloseModal();
  renderVeri();
};

window.qeCloseModal = () => {
  const m = document.getElementById('qe-modal');
  if (m) m.remove();
};

window.qeConfirmModal = () => {
  const data = DataService.getData();
  const priceList = qeState.priceDate ? (data.priceLists[qeState.priceDate] || data.prices || []) : (data.prices || []);
  const priceMap = {};
  priceList.forEach(p => { priceMap[p.product] = p; });

  const selected = [...document.querySelectorAll('.modal-chip-sel')].map(c => c.dataset.product);
  
  // Keep existing kilos for already-selected products; add new ones
  // We MUST support manual products! Manual products have price=0.
  // Let's look up the current qeState.selectedProducts to find manual ones
  const currentMap = {};
  qeState.selectedProducts.forEach(p => { currentMap[p.product] = p; });

  const newSelected = selected.map(name => {
    if (priceMap[name]) return priceMap[name];
    if (currentMap[name]) return currentMap[name]; // It's a manual product!
    return { product: name, price: 0, unit: 'KG' }; // Fallback
  }).filter(Boolean);

  // Remove kilos and overrides for deselected products
  const newSelectedNames = new Set(newSelected.map(p => p.product));
  Object.keys(qeState.kilos).forEach(k => { if (!newSelectedNames.has(k)) delete qeState.kilos[k]; });
  Object.keys(qeState.overridePrices).forEach(k => { if (!newSelectedNames.has(k)) delete qeState.overridePrices[k]; });
  
  qeState.selectedProducts = newSelected;
  window.qeCloseModal();
  renderVeri();
  setTimeout(() => { const first = document.querySelector('.qe-table-input'); if (first) first.focus(); }, 100);
};

window.qeSet = (key, val) => {
  qeState[key] = val;
  if (key === 'date') {
    const data = DataService.getData();
    if (data.priceLists && data.priceLists[val]) {
      qeState.priceDate = val;
      window.qeUpdateSelectedProductPrices();
      renderVeri();
    } else {
      window.qePromptPriceList(val);
    }
  } else {
    renderVeri();
  }
};

window.qeUpdateSelectedProductPrices = () => {
  const data = DataService.getData();
  const priceList = qeState.priceDate ? (data.priceLists[qeState.priceDate] || data.prices || []) : (data.prices || []);
  const priceMap = {};
  priceList.forEach(p => { priceMap[p.product] = p; });
  
  qeState.selectedProducts = qeState.selectedProducts.map(p => {
    if (priceMap[p.product]) {
      return { ...p, price: priceMap[p.product].price, unit: priceMap[p.product].unit };
    }
    return p;
  });
};

window.qePromptPriceList = (targetDate) => {
  const data = DataService.getData();
  const priceLists = data.priceLists || {};
  const sortedDates = Object.keys(priceLists).sort((a, b) => b.localeCompare(a));
  
  if (sortedDates.length === 0) {
    alert("Kayıtlı herhangi bir fiyat listesi bulunamadı! Lütfen önce Fiyat Listesi sayfasından fiyatları çekin.");
    return;
  }
  
  const options = sortedDates.map(d => `<option value="${d}">${formatAppDate(d)}</option>`).join('');
  const modalInputStyle = 'width:100%;box-sizing:border-box;padding:10px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:white;font-family:Outfit,sans-serif;font-size:.95rem;outline:none;';
  
  // Custom modal for selecting price list date
  const m = document.createElement('div');
  m.id = 'price-select-modal';
  m.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this){document.getElementById('price-select-modal').remove(); renderVeri();}">
    <div class="modal-box" style="max-width:420px; text-align: center;">
      <div class="modal-header">
        <span><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;color:#eab308;"></i>Fiyat Listesi Seçin</span>
        <button onclick="document.getElementById('price-select-modal').remove(); renderVeri();" style="background:none;border:none;color:#9ca3af;font-size:1.4rem;cursor:pointer;">✕</button>
      </div>
      <p style="color:#e2e8f0; margin:16px 0; font-size:0.95rem; line-height: 1.5;">
        <strong>${formatAppDate(targetDate)}</strong> tarihine ait bir fiyat listesi bulunamadı.<br>
        İşlem için hangi tarihin fiyat listesini kullanmak istersiniz?
      </p>
      <div style="margin-bottom:20px;">
        <select id="ps-date" style="${modalInputStyle}">
          ${options}
        </select>
      </div>
      <button onclick="window.qeConfirmPriceListDate('${targetDate}')" class="dash-btn btn-green" style="margin:0;padding:12px;width:100%;">
        <i class="fa-solid fa-check"></i> FİYAT LİSTESİNİ KULLAN
      </button>
    </div>
  </div>`;
  document.body.appendChild(m);
};

window.qeConfirmPriceListDate = (targetDate) => {
  const selectedDate = document.getElementById('ps-date').value;
  qeState.priceDate = selectedDate;
  window.qeUpdateSelectedProductPrices();
  const modal = document.getElementById('price-select-modal');
  if (modal) modal.remove();
  renderVeri();
};

window.qeSetKilo = (product, val) => {
  qeState.kilos[product] = val;
  const rows = document.querySelectorAll('.qe-table tbody tr');
  rows.forEach(row => {
    const nameCell = row.cells[0];
    if (!nameCell || !nameCell.textContent.trim().includes(product)) return;
    
    const kilo = parseFloat(String(val).replace(',','.')) || 0;
    row.classList.toggle('qe-row-active', kilo > 0);
    
    const buyInput = row.cells[1].querySelector('input');
    const supplyInput = row.cells[2].querySelector('input');
    const buyVal = buyInput && buyInput.value ? parseFloat(String(buyInput.value).replace(',','.')) : 0;
    const supplyVal = supplyInput && supplyInput.value ? parseFloat(String(supplyInput.value).replace(',','.')) : 0;
    
    const halCell = row.cells[4];
    const tedCell = row.cells[5];
    const farkCell = row.cells[6];
    
    if (kilo > 0) {
      if (halCell) halCell.textContent = formatCurrency(buyVal * kilo);
      if (tedCell) tedCell.textContent = formatCurrency(supplyVal * kilo);
      if (farkCell) {
        farkCell.textContent = formatCurrency((supplyVal - buyVal) * kilo);
        farkCell.style.color = (supplyVal >= buyVal) ? '#10b981' : '#ef4444';
      }
    } else {
      if (halCell) halCell.textContent = '—';
      if (tedCell) tedCell.textContent = '—';
      if (farkCell) {
        farkCell.textContent = '—';
        farkCell.style.color = '#9ca3af';
      }
    }
  });

  const pending = qeState.selectedProducts.filter(p => {
    const k = parseFloat(String(qeState.kilos[p.product]).replace(',','.')) || 0;
    return k > 0;
  }).length;
  const btn = document.querySelector('.dash-btn.btn-green');
  if (btn) {
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> KAYDET (${pending})`;
    btn.disabled = pending === 0;
  }
};

window.qeSetPrice = (product, type, val) => {
  if (!qeState.overridePrices[product]) qeState.overridePrices[product] = {};
  if (val === '') {
    qeState.overridePrices[product][type] = undefined;
  } else {
    qeState.overridePrices[product][type] = parseFloat(String(val).replace(',', '.'));
  }
  // Recalculate totals in DOM without losing focus
  window.qeSetKilo(product, qeState.kilos[product] || '');
};

window.qeRemoveProduct = (product) => {
  qeState.selectedProducts = qeState.selectedProducts.filter(p => p.product !== product);
  delete qeState.kilos[product];
  delete qeState.overridePrices[product];
  renderVeri();
};

window.qeSave = () => {
  const priceMap = {};
  qeState.selectedProducts.forEach(p => { priceMap[p.product] = p; });
  let saved = 0;
  Object.entries(qeState.kilos).forEach(([product, kiloStr]) => {
    const kilo = parseFloat(String(kiloStr).replace(',','.')) || 0;
    if (!kilo || kilo <= 0) return;
    
    const p = priceMap[product] || { product, price: 0 };
    const ov = qeState.overridePrices[product] || {};
    
    const basePrice = typeof p.price === 'number' ? p.price : (parseFloat(String(p.price).replace(/\./g,'').replace(',','.')) || 0);
    const buyPrice = ov.buy !== undefined ? ov.buy : basePrice;
    const supplyPrice = ov.supply !== undefined ? ov.supply : basePrice;
    
    DataService.addTransaction({
      date: qeState.date,
      supplier: qeState.supplier,
      hotel: qeState.hotel,
      product,
      qty: kilo,
      adet: '-',
      buyPrice,
      supplyPrice
    });
    saved++;
  });
  renderVeri();
  renderDashboard();
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:32px;right:32px;background:#10b981;color:white;padding:16px 24px;border-radius:12px;font-weight:700;font-family:Outfit,sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:slideIn 0.3s ease;';
  toast.innerHTML = `<i class="fa-solid fa-check" style="margin-right:8px;"></i>${saved} kalem kaydedildi! Ekran temizlenmedi, başka otel için devam edebilirsiniz.`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

window.qeClear = () => { qeState.kilos = {}; qeState.selectedProducts = []; qeState.overridePrices = {}; renderVeri(); };


let odemeFilters = { account: null, dateFrom: null, dateTo: null };
window.setOdemeFilter = (key, val) => { odemeFilters[key] = val; renderOdemeler(); };

function renderOdemeler() {
  viewTitle.innerText = 'ÖDEMELER';
  const allPy = DataService.getData().payments;
  
  if (!odemeFilters.dateFrom) {
    const now = new Date();
    odemeFilters.dateFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    odemeFilters.dateTo = now.toISOString().split('T')[0];
  }
  
  const accounts = [...new Set(allPy.map(p => (p.account||'').trim()))].sort();
  
  const py = allPy.filter(p => {
    if (odemeFilters.account && p.account !== odemeFilters.account) return false;
    if (odemeFilters.dateFrom && p.date < odemeFilters.dateFrom) return false;
    if (odemeFilters.dateTo && p.date > odemeFilters.dateTo) return false;
    return true;
  });

  let html = `
    <div class="top-filter-bar glass-panel" style="margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
      <div style="flex:1; display:flex; gap:16px; flex-wrap:wrap;">
        ${renderDropdownHtml('CARİ ADI', accounts, odemeFilters.account, 'setOdemeFilter', 'account')}
        <div class="top-filter-group">
          <label>BAŞLA</label>
          <input type="date" value="${odemeFilters.dateFrom}" onchange="window.setOdemeFilter('dateFrom', this.value)" style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 12px;font-family:'Outfit',sans-serif;cursor:pointer;">
        </div>
        <div class="top-filter-group">
          <label>BİTİŞ</label>
          <input type="date" value="${odemeFilters.dateTo}" onchange="window.setOdemeFilter('dateTo', this.value)" style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 12px;font-family:'Outfit',sans-serif;cursor:pointer;">
        </div>
        <div class="top-filter-group">
          <label>&nbsp;</label>
          <button onclick="window.setOdemeFilter('dateFrom', null); window.setOdemeFilter('dateTo', null); odemeFilters.dateFrom = null; odemeFilters.dateTo = null; renderOdemeler();" style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 14px;cursor:pointer;font-family:'Outfit',sans-serif;">Tüm Zamanlar</button>
        </div>
      </div>
    </div>
    <table>
    <thead><tr><th>TARİH</th><th>CARİ ADI</th><th>ÖDEME TUTARI</th><th>AÇIKLAMA</th><th>İŞLEM</th></tr></thead>
    <tbody>`;
  py.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(p => {
    html += `<tr>
      <td>${formatAppDate(p.date)}</td><td>${p.account}</td><td><span style="color:#eab308;font-weight:700;">${formatCurrency(p.amount)}</span></td><td>${p.description}</td>
      <td style="white-space:nowrap;">
        <button onclick="window.editPayment(${p.id})" title="Düzenle" style="background:rgba(96,165,250,.15);color:#60a5fa;border:1px solid rgba(96,165,250,.3);border-radius:6px;padding:4px 8px;cursor:pointer;margin-right:4px;"><i class="fa-solid fa-pen"></i></button>
        <button onclick="window.deletePayment(${p.id})" title="Sil" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:6px;padding:4px 8px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
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

let ozetFilters = { type: null, name: null, dateFrom: null, dateTo: null };
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
  
  const allNames = allBalances.map(b => b.name).sort();

  const balances = allBalances.filter(b => {
    if (b.totalBought === 0 && b.totalPaid === 0) return false;
    const tName = b.type === 'supplier' ? 'Tedarikçi' : 'Müşteri';
    if (ozetFilters.type && tName !== ozetFilters.type) return false;
    if (ozetFilters.name && b.name !== ozetFilters.name) return false;
    return true;
  });

  // Calculate totals for the selected date range
  let sumTedIslem = 0;
  let sumMusIslem = 0;
  let sumOdenen = 0;
  let sumTahsil = 0;

  balances.forEach(b => {
    if (b.type === 'supplier') {
      sumTedIslem += b.totalBought;
      sumOdenen += b.totalPaid;
    } else {
      sumMusIslem += b.totalBought;
      sumTahsil += b.totalPaid;
    }
  });

  let html = `
    <div class="top-filter-bar glass-panel" style="margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
      <div style="flex:1; display:flex; gap:16px; flex-wrap:wrap;">
        ${renderDropdownHtml('CARİ TİPİ', types, ozetFilters.type, 'setOzetFilter', 'type')}
        ${renderDropdownHtml('CARİ ADI', allNames, ozetFilters.name, 'setOzetFilter', 'name')}
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
    </div>
    
    <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap:wrap;">
      <div class="glass-panel" style="flex: 1; min-width:200px; padding:16px;">
        <h4 style="color:#9ca3af;font-size:0.8rem;margin:0 0 8px 0;">TEDARİKÇİ İŞLEM HACMİ</h4>
        <h2 style="color:#60a5fa;margin:0;">${formatCurrency(sumTedIslem)}</h2>
      </div>
      <div class="glass-panel" style="flex: 1; min-width:200px; padding:16px;">
        <h4 style="color:#9ca3af;font-size:0.8rem;margin:0 0 8px 0;">MÜŞTERİ İŞLEM HACMİ</h4>
        <h2 style="color:#10b981;margin:0;">${formatCurrency(sumMusIslem)}</h2>
      </div>
      <div class="glass-panel" style="flex: 1; min-width:200px; padding:16px;">
        <h4 style="color:#9ca3af;font-size:0.8rem;margin:0 0 8px 0;">TEDARİKÇİYE ÖDENEN</h4>
        <h2 style="color:#eab308;margin:0;">${formatCurrency(sumOdenen)}</h2>
      </div>
      <div class="glass-panel" style="flex: 1; min-width:200px; padding:16px;">
        <h4 style="color:#9ca3af;font-size:0.8rem;margin:0 0 8px 0;">MÜŞTERİDEN TAHSİLAT</h4>
        <h2 style="color:#8b5cf6;margin:0;">${formatCurrency(sumTahsil)}</h2>
      </div>
    </div>

    <div class="glass-panel">
      <table>
      <thead><tr><th>CARİ TİPİ</th><th>CARİ ADI</th><th>SON İŞLEM</th><th>İŞLEM HACMİ</th><th>ÖDENEN / TAHSİL</th><th>BAKİYE</th></tr></thead>
      <tbody>`;
  balances.forEach(b => {
    html += `<tr onclick="window.showAccountDetail({name:'${b.name.replace(/'/g,"\\'")}',type:'${b.type}'})" style="cursor:pointer;" class="hover-row">
      <td>${b.type === 'supplier' ? 'Tedarikçi' : 'Müşteri'}</td>
      <td><strong>${b.name}</strong></td>
      <td style="color:#9ca3af;">${formatAppDate(b.lastTxDate)}</td>
      <td>${formatCurrency(b.totalBought)}</td>
      <td>${formatCurrency(b.totalPaid)}</td>
      <td><span class="${b.balance >= 0 ? 'success' : 'danger'}">${formatCurrency(b.balance)}</span></td>
    </tr>`;
  });
  html += `</tbody></table>
    </div>`;
  viewContent.innerHTML = html;
  initTableFeatures();
}

function showAccountDetail(acc) {
  viewDash.classList.remove('active');
  viewOther.classList.add('active');
  viewTitle.innerText = `${acc.name.trim()} - HESAP EKSTRESİ`;
  
  const data = DataService.getData();
  const txs = data.transactions.filter(t => (t.hotel||'').trim() === acc.name.trim() || (t.supplier||'').trim() === acc.name.trim());
  const pms = data.payments.filter(p => (p.account||'').trim() === acc.name.trim());
  
  const balances = DataService.getAccountBalances();
  const b = balances.find(x => x.name.trim() === acc.name.trim()) || { totalBought: 0, totalPaid: 0, balance: 0 };
  
  const totalQty = txs.reduce((sum, t) => sum + t.qty, 0);
  
  let html = `
    <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
      <div class="glass-panel" style="flex: 1; min-width: 150px; text-align: center; padding: 16px;">
        <h3 style="font-size:0.85rem;color:var(--text-secondary);margin:0 0 6px 0;">TOPLAM KİLO</h3>
        <h2 style="color: #a855f7;margin:0;">${totalQty.toLocaleString('tr-TR')}</h2>
      </div>
      <div class="glass-panel" style="flex: 1; min-width: 150px; text-align: center; padding: 16px;">
        <h3 style="font-size:0.85rem;color:var(--text-secondary);margin:0 0 6px 0;">TOPLAM TUTAR</h3>
        <h2 style="color: #60a5fa;margin:0;">${formatCurrency(b.totalBought)}</h2>
      </div>
      <div class="glass-panel" style="flex: 1; min-width: 150px; text-align: center; padding: 16px;">
        <h3 style="font-size:0.85rem;color:var(--text-secondary);margin:0 0 6px 0;">TOPLAM ÖDEME</h3>
        <h2 style="color: #eab308;margin:0;">${formatCurrency(b.totalPaid)}</h2>
      </div>
      <div class="glass-panel" style="flex: 1; min-width: 150px; text-align: center; padding: 16px;">
        <h3 style="font-size:0.85rem;color:var(--text-secondary);margin:0 0 6px 0;">KALAN BAKİYE</h3>
        <h2 style="color: ${b.balance >= 0 ? '#10b981' : '#ef4444'};margin:0;">${formatCurrency(b.balance)}</h2>
      </div>
    </div>
    <div class="glass-panel">
      <h3 style="margin-bottom:16px;">Son İşlemler</h3>
      <table>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Mal / İşlem</th>
            <th>Kilo</th>
            <th>Birim Fiyat</th>
            <th>Tutar</th>
            <th>Ödeme</th>
            <th>Bakiye</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  const allEvents = [
    ...txs.map(t => {
      const kilo = t.qty;
      const price = acc.type === 'supplier' ? t.buyPrice : t.supplyPrice;
      const tutar = kilo * price;
      return {
        date: t.date,
        desc: t.product,
        kilo: kilo,
        price: price,
        tutar: tutar,
        odeme: 0,
        type: 'tx'
      };
    }),
    ...pms.map(p => ({
      date: p.date,
      desc: p.description || 'NAKİT',
      kilo: 0,
      price: 0,
      tutar: 0,
      odeme: p.amount,
      type: 'pm'
    }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = 0;
  allEvents.forEach(e => {
    runningBalance += e.tutar - e.odeme;
    e.bakiye = runningBalance;
  });

  const displayEvents = [...allEvents].reverse();

  displayEvents.forEach(e => {
    if (e.type === 'tx') {
      html += `<tr>
        <td>${formatAppDate(e.date)}</td>
        <td><strong>${e.desc}</strong></td>
        <td>${e.kilo.toLocaleString('tr-TR')}</td>
        <td>${formatCurrency(e.price)}</td>
        <td>${formatCurrency(e.tutar)}</td>
        <td>—</td>
        <td><span class="${e.bakiye >= 0 ? 'success' : 'danger'}">${formatCurrency(e.bakiye)}</span></td>
      </tr>`;
    } else {
      html += `<tr>
        <td>${formatAppDate(e.date)}</td>
        <td><em>${e.desc}</em></td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td><span style="color:#eab308;font-weight:700;">${formatCurrency(e.odeme)}</span></td>
        <td><span class="${e.bakiye >= 0 ? 'success' : 'danger'}">${formatCurrency(e.bakiye)}</span></td>
      </tr>`;
    }
  });
  
  html += `</tbody></table></div>`;
  viewContent.innerHTML = html;
  initTableFeatures();
}

let pivotFilters = { hotel: null, supplier: null, product: null, dateFrom: null, dateTo: null };
function renderPivot() {
  viewTitle.innerText = 'PİVOT TABLO (SEVK RAPORU)';
  const data = DataService.getData();
  
  if (!pivotFilters.dateFrom) {
    const now = new Date();
    pivotFilters.dateFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    pivotFilters.dateTo = now.toISOString().split('T')[0];
  }
  
  // Extract unique values
  const hotels = [...new Set(data.transactions.map(t => (t.hotel||'').trim()))];
  const suppliers = [...new Set(data.transactions.map(t => (t.supplier||'').trim()))];
  const prods = [...new Set(data.transactions.map(t => (t.product||'').trim()))];
  
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
    if (pivotFilters.dateFrom && t.date < pivotFilters.dateFrom) return false;
    if (pivotFilters.dateTo && t.date > pivotFilters.dateTo) return false;
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
      <div class="top-filter-bar glass-panel" style="flex-wrap: wrap; gap: 16px;">
        ${renderDropdownSlicer('GİTTİĞİ YER', hotels, 'hotel')}
        ${renderDropdownSlicer('MÜSTAHSİL', suppliers, 'supplier')}
        ${renderDropdownSlicer('MAL', prods, 'product')}
        <div class="top-filter-group">
          <label>BAŞLANGIÇ</label>
          <input type="date" value="${pivotFilters.dateFrom}" onchange="window.setPivotFilter('dateFrom', this.value)" style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 12px;font-family:'Outfit',sans-serif;cursor:pointer;">
        </div>
        <div class="top-filter-group">
          <label>BİTİŞ</label>
          <input type="date" value="${pivotFilters.dateTo}" onchange="window.setPivotFilter('dateTo', this.value)" style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 12px;font-family:'Outfit',sans-serif;cursor:pointer;">
        </div>
        <div class="top-filter-group">
          <label>&nbsp;</label>
          <button onclick="window.setPivotFilter('dateFrom', null); window.setPivotFilter('dateTo', null);" style="background:rgba(255,255,255,0.1);color:white;border:1px solid var(--panel-border);border-radius:8px;padding:8px 14px;cursor:pointer;font-family:'Outfit',sans-serif;">Tüm Zamanlar</button>
        </div>
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

// ── EDIT / DELETE / ÖDEME MODAL FUNCTIONS ───────────────────────────────

const modalInputStyle = 'width:100%;box-sizing:border-box;padding:10px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:white;font-family:Outfit,sans-serif;font-size:.95rem;outline:none;';

function openGenericModal(html, id = 'generic-modal') {
  const m = document.createElement('div');
  m.id = id;
  m.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this){document.getElementById('${id}').remove();}">${html}</div>`;
  document.body.appendChild(m);
}

// Ödeme Ekle Modal
window.openOdemeModal = (existing) => {
  const data = DataService.getData();
  const accounts = data.accounts.map(a => `<option value="${a.name}" ${existing&&existing.account===a.name?'selected':''}>${a.name}</option>`).join('');
  const today = new Date().toISOString().split('T')[0];
  openGenericModal(`
    <div class="modal-box" style="max-width:480px;">
      <div class="modal-header">
        <span><i class="fa-solid fa-money-bill-wave" style="margin-right:8px;color:#7c3aed;"></i>${existing?'Ödeme Düzenle':'Ödeme Ekle'}</span>
        <button onclick="document.getElementById('odeme-modal').remove()" style="background:none;border:none;color:#9ca3af;font-size:1.4rem;cursor:pointer;">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:16px;">
        <div class="top-filter-group" style="flex:1;">
          <label>TARİH</label>
          <input type="date" id="om-date" value="${existing?existing.date:today}" style="${modalInputStyle}">
        </div>
        <div class="top-filter-group" style="flex:1;">
          <label>CARİ ADI</label>
          <select id="om-account" style="${modalInputStyle}">${accounts}</select>
        </div>
        <div class="top-filter-group" style="flex:1;">
          <label>ÖDEME TUTARI (₺)</label>
          <input type="number" id="om-amount" value="${existing?existing.amount:''}" placeholder="0.00" step="0.01" style="${modalInputStyle}">
        </div>
        <div class="top-filter-group" style="flex:1;">
          <label>AÇIKLAMA</label>
          <input type="text" id="om-desc" value="${existing?existing.description:'NAKİT'}" style="${modalInputStyle}">
        </div>
        <button onclick="window.saveOdemeModal(${existing?existing.id:'null'})" class="dash-btn btn-green" style="margin:0;padding:12px;">
          <i class="fa-solid fa-floppy-disk"></i> KAYDET
        </button>
      </div>
    </div>
  `, 'odeme-modal');
};

window.saveOdemeModal = (existingId) => {
  const date    = document.getElementById('om-date').value;
  const account = document.getElementById('om-account').value;
  const amount  = Number(document.getElementById('om-amount').value);
  const description = document.getElementById('om-desc').value || 'NAKİT';
  if (!date || !account || !amount) { alert('Lütfen tüm alanları doldurun.'); return; }

  if (existingId && existingId !== 'null') {
    DataService.updatePayment(existingId, { date, account, amount, description });
  } else {
    DataService.addPayment({ date, account, amount, description });
  }
  document.getElementById('odeme-modal').remove();
  renderOdemeler();
  renderDashboard();
};

// Ödeme Düzenle
window.editPayment = (id) => {
  const p = DataService.getData().payments.find(x => x.id === id);
  if (!p) return;
  window.openOdemeModal(p);
};

// Ödeme Sil
window.deletePayment = (id) => {
  if (!confirm('Bu ödeme kaydını silmek istediğinizden emin misiniz?')) return;
  DataService.deletePayment(id);
  renderOdemeler();
  renderDashboard();
};

// Transaction Düzenle
window.editTransaction = (id) => {
  const tx = DataService.getData().transactions.find(t => t.id === id);
  if (!tx) return;
  const data = DataService.getData();
  const suppliers = data.accounts.filter(a => a.type === 'supplier').map(a => `<option value="${a.name}" ${a.name===tx.supplier?'selected':''}>${a.name}</option>`).join('');
  const hotels    = data.accounts.filter(a => a.type === 'hotel').map(a => `<option value="${a.name}" ${a.name===tx.hotel?'selected':''}>${a.name}</option>`).join('');
  openGenericModal(`
    <div class="modal-box" style="max-width:520px;">
      <div class="modal-header">
        <span><i class="fa-solid fa-pen" style="margin-right:8px;color:#60a5fa;"></i>İşlem Düzenle</span>
        <button onclick="document.getElementById('tx-edit-modal').remove()" style="background:none;border:none;color:#9ca3af;font-size:1.4rem;cursor:pointer;">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:16px;">
        <div class="top-filter-group"><label>TARİH</label><input type="date" id="te-date" value="${tx.date}" style="${modalInputStyle}"></div>
        <div class="top-filter-group"><label>MÜSTAHSİL</label><select id="te-supplier" style="${modalInputStyle}">${suppliers}</select></div>
        <div class="top-filter-group"><label>ÜRÜN</label><input type="text" id="te-product" value="${tx.product}" style="${modalInputStyle}"></div>
        <div class="top-filter-group"><label>GİTTİĞİ YER</label><select id="te-hotel" style="${modalInputStyle}">${hotels}</select></div>
        <div class="top-filter-group"><label>KİLO</label><input type="number" id="te-qty" value="${tx.qty}" step="0.01" style="${modalInputStyle}"></div>
        <div class="top-filter-group"><label>ALIŞ FİYATI (HAL)</label><input type="number" id="te-buy" value="${tx.buyPrice}" step="0.01" style="${modalInputStyle}"></div>
        <div class="top-filter-group"><label>TEDARİK FİYATI</label><input type="number" id="te-supply" value="${tx.supplyPrice}" step="0.01" style="${modalInputStyle}"></div>
        <button onclick="window.saveTxEdit(${tx.id})" class="dash-btn btn-green" style="margin:0;padding:12px;">
          <i class="fa-solid fa-floppy-disk"></i> KAYDET
        </button>
      </div>
    </div>
  `, 'tx-edit-modal');
};

window.saveTxEdit = (id) => {
  const date        = document.getElementById('te-date').value;
  const supplier    = document.getElementById('te-supplier').value;
  const product     = document.getElementById('te-product').value;
  const hotel       = document.getElementById('te-hotel').value;
  const qty         = Number(document.getElementById('te-qty').value);
  const buyPrice    = Number(document.getElementById('te-buy').value);
  const supplyPrice = Number(document.getElementById('te-supply').value);
  DataService.updateTransaction(id, { date, supplier, product, hotel, qty, buyPrice, supplyPrice });
  document.getElementById('tx-edit-modal').remove();
  renderVeri();
  renderDashboard();
};

// Transaction Sil
window.deleteTransaction = (id) => {
  if (!confirm('Bu işlem kaydını silmek istediğinizden emin misiniz?')) return;
  DataService.deleteTransaction(id);
  renderVeri();
  renderDashboard();
};

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




window.qeToggleChip = (el, product) => {
  el.classList.toggle('modal-chip-sel');
  const count = document.querySelectorAll('.modal-chip-sel').length;
  const counter = document.getElementById('modal-sel-count');
  if (counter) counter.textContent = `${count} seçili`;
};

window.qeModalSearch = (query) => {
  const q = query.toLowerCase();
  document.querySelectorAll('.modal-chip').forEach(el => {
    const p = el.getAttribute('data-product').toLowerCase();
    el.style.display = p.includes(q) ? 'inline-block' : 'none';
  });
};
