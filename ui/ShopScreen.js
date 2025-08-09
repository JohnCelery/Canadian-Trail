import { getState, addLog } from '../state/GameState.js';
import { priceAt, canBuy, canSell, applyPurchase, applySell, items } from '../systems/shop.js';

export function showShopScreen(landmark, onClose) {
  const state = getState();
  const modal = document.createElement('div');
  modal.id = 'shop-modal';
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.innerHTML = `
    <h2>Shop</h2>
    <table id="shop-table">
      <thead><tr><th>Item</th><th>Price</th><th>Inventory</th><th>Qty</th></tr></thead>
      <tbody></tbody>
    </table>
    <div id="shop-total">Total: $<span id="cart-total">0.00</span></div>
    <div class="shop-actions">
      <button id="buy-btn" disabled>Buy</button>
      <button id="sell-btn" disabled>Sell</button>
      <button id="close-shop">Back</button>
    </div>
  `;
  document.body.appendChild(modal);

  const tbody = modal.querySelector('tbody');
  const inputs = {};

  items.forEach(it => {
    const price = priceAt(landmark.index, it.basePrice);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.name}</td>
      <td>$${price.toFixed(2)}</td>
      <td class="inv">${state.inventory[it.id] || 0}</td>
      <td><input type="number" min="0" value="0" step="1" id="qty-${it.id}"></td>
    `;
    tbody.appendChild(tr);
    inputs[it.id] = tr.querySelector('input');
    inputs[it.id].addEventListener('input', updateTotals);
  });

  const buyBtn = modal.querySelector('#buy-btn');
  const sellBtn = modal.querySelector('#sell-btn');
  const closeBtn = modal.querySelector('#close-shop');
  const totalSpan = modal.querySelector('#cart-total');

  function updateTotals() {
    let buyTotal = 0;
    let canBuyAll = true;
    let canSellAll = true;
    items.forEach(it => {
      const qty = parseInt(inputs[it.id].value, 10) || 0;
      const price = priceAt(landmark.index, it.basePrice) * qty;
      if (qty > 0) {
        if (!canBuy(state, it.id, qty)) canBuyAll = false;
        if (!canSell(state, it.id, qty)) canSellAll = false;
        buyTotal += price;
      }
    });
    totalSpan.textContent = buyTotal.toFixed(2);
    buyBtn.disabled = !canBuyAll || buyTotal <= 0;
    sellBtn.disabled = !canSellAll;
  }

  buyBtn.addEventListener('click', () => {
    const cart = [];
    items.forEach(it => {
      const qty = parseInt(inputs[it.id].value, 10) || 0;
      if (qty > 0) cart.push({ id: it.id, qty });
    });
    applyPurchase(state, cart, addLog);
    items.forEach(it => { inputs[it.id].value = 0; });
    refreshInventory();
    updateTotals();
  });

  sellBtn.addEventListener('click', () => {
    const cart = [];
    items.forEach(it => {
      const qty = parseInt(inputs[it.id].value, 10) || 0;
      if (qty > 0) cart.push({ id: it.id, qty });
    });
    applySell(state, cart, addLog);
    items.forEach(it => { inputs[it.id].value = 0; });
    refreshInventory();
    updateTotals();
  });

  function refreshInventory() {
    items.forEach(it => {
      const row = inputs[it.id].closest('tr');
      row.querySelector('.inv').textContent = state.inventory[it.id] || 0;
    });
  }

  closeBtn.addEventListener('click', () => {
    modal.remove();
    onClose && onClose();
  });

  function trap(e) {
    if (e.key === 'Tab') {
      const focusables = Array.from(modal.querySelectorAll('button, input'));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
    if (e.key === 'Escape') {
      closeBtn.click();
    }
  }
  modal.addEventListener('keydown', trap);

  refreshInventory();
  updateTotals();
  const focusables = modal.querySelectorAll('button, input');
  if (focusables.length) focusables[0].focus();
}
