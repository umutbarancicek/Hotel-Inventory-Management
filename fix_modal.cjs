const fs = require('fs');
const file = 'C:/Users/Baran/Documents/GitHub/Hotel-Inventory-Management/main.js';
let content = fs.readFileSync(file, 'utf8');

const modalStart = content.indexOf('window.qeOpenModal = () => {');
const modalEnd = content.indexOf('window.qeCloseModal = () => {');

if (modalStart !== -1 && modalEnd !== -1) {
  const newModalFunc = `window.qeOpenModal = () => {
  const latestPrices = DataService.getLatestPrices();
  const selectedSet = new Set(qeState.selectedProducts.map(p => p.product));

  const chips = latestPrices.map(p => {
    const sel = selectedSet.has(p.product);
    return \`<div class="modal-chip \${sel?'modal-chip-sel':''}" data-product="\${p.product}" onclick="window.qeToggleChip(this,'\${p.product.replace(/'/g,"\\\\'")}')">\${p.product}</div>\`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'qe-modal';
  modal.innerHTML = \`
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
        <div class="modal-chips" id="modal-chips">\${chips || '<p style="color:#9ca3af;font-size:0.9rem;text-align:center;width:100%;padding:10px;">Fiyat listesi boş. Lütfen "Fiyat Listesi" sekmesinden fiyatları çekin veya manuel ürün ekleyin.</p>'}</div>
        <div class="modal-footer">
          <span id="modal-sel-count" style="color:#9ca3af;font-size:.9rem;">\${selectedSet.size} seçili</span>
          <button onclick="window.qeConfirmModal()" class="dash-btn btn-green" style="margin:0;padding:10px 24px;">Tamam</button>
        </div>
      </div>
    </div>
  \`;
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

`;

  content = content.substring(0, modalStart) + newModalFunc + content.substring(modalEnd);
  fs.writeFileSync(file, content);
  console.log('Modal fixed and manual product logic added!');
} else {
  console.error('Could not find modal bounds!');
}
