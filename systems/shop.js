import { loadJSON } from './jsonLoader.js';
import { landmarks } from './landmarks.js';
export const items = await loadJSON('../data/items.json', import.meta.url);

const itemsById = Object.fromEntries(items.map(i => [i.id, i]));
const totalLandmarks = landmarks.length;

function roundToCents(v) {
  return Math.round(v * 100) / 100;
}

export function priceAt(landmarkIndex, basePrice) {
  const inflation = 1 + 0.15 * (landmarkIndex / (totalLandmarks - 1));
  return roundToCents(basePrice * inflation);
}

export function canBuy(state, itemId, qty) {
  if (qty <= 0) return false;
  const item = itemsById[itemId];
  if (!item) return false;
  const price = priceAt(state.activeLandmark.index, item.basePrice) * qty;
  return state.inventory.money >= price;
}

export function canSell(state, itemId, qty) {
  if (qty <= 0) return false;
  const item = itemsById[itemId];
  if (!item) return false;
  const have = state.inventory[itemId] || 0;
  return have >= qty;
}

export function applyPurchase(state, cart, log = () => {}) {
  for (const { id, qty } of cart) {
    if (qty <= 0) continue;
    const item = itemsById[id];
    if (!item) continue;
    const price = priceAt(state.activeLandmark.index, item.basePrice) * qty;
    if (state.inventory.money >= price) {
      state.inventory.money = roundToCents(state.inventory.money - price);
      state.inventory[id] = (state.inventory[id] || 0) + qty;
      log(`Bought ${qty} ${item.unit} ${item.name} for $${price.toFixed(2)}`);
    }
  }
}

export function applySell(state, cart, log = () => {}) {
  for (const { id, qty } of cart) {
    if (qty <= 0) continue;
    const item = itemsById[id];
    if (!item) continue;
    const have = state.inventory[id] || 0;
    const sellQty = Math.min(qty, have);
    if (sellQty > 0) {
      const price = priceAt(state.activeLandmark.index, item.basePrice) * sellQty;
      state.inventory.money = roundToCents(state.inventory.money + price);
      state.inventory[id] = have - sellQty;
      log(`Sold ${sellQty} ${item.unit} ${item.name} for $${price.toFixed(2)}`);
    }
  }
}

