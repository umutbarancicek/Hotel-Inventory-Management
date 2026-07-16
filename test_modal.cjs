const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global.window = dom.window;
global.document = dom.window.document;
global.qeState = { selectedProducts: [] };
global.DataService = { getLatestPrices: () => [{product: 'Domates'}, {product: 'Biber'}] };

window.qeOpenModal = () => {
  const latestPrices = DataService.getLatestPrices();
  if (latestPrices.length === 0) return;
  const selectedSet = new Set(qeState.selectedProducts.map(p => p.product));

  const chips = latestPrices.map(p => {
    const sel = selectedSet.has(p.product);
    return `<div class="modal-chip ${sel?'modal-chip-sel':''}" data-product="${p.product}" onclick="window.qeToggleChip(this,'${p.product.replace(/'/g,"\\'")}')">${p.product}</div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'qe-modal';
  modal.innerHTML = `<div class="modal-overlay"><div class="modal-box"><input id="modal-search"><div class="modal-chips" id="modal-chips">${chips}</div></div></div>`;
  document.body.appendChild(modal);
  document.getElementById('modal-search').focus();
  console.log('Success!');
};
window.qeOpenModal();
