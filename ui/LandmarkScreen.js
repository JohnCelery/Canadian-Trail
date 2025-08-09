import { rest, addLog, closeLandmark, getState, enterRiver } from '../state/GameState.js';
import { random } from '../state/GameState.js';
import { showShopScreen } from './ShopScreen.js';
import { openRiverModal } from './RiverModal.js';

export function showLandmarkScreen(landmark, onClose) {
  const modal = document.createElement('div');
  modal.id = 'landmark-modal';
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  const talk = landmark.talk && landmark.talk.length
    ? landmark.talk[Math.floor(random() * landmark.talk.length)]
    : '';
  modal.innerHTML = `
    <h2>${landmark.name}</h2>
    <p>Mile ${landmark.mile}</p>
    <p id="landmark-talk">${talk}</p>
    <div id="landmark-services"></div>
    <div class="landmark-actions"></div>
  `;
  document.body.appendChild(modal);

  const servicesDiv = modal.querySelector('#landmark-services');
  const actionsDiv = modal.querySelector('.landmark-actions');

  const buttons = [];
  if (landmark.services.shop) {
    const b = document.createElement('button');
    b.textContent = 'Shop';
    b.addEventListener('click', () => {
      showShopScreen(landmark, () => {
        modal.style.display = 'block';
        trapFocus();
      });
      modal.style.display = 'none';
    });
    servicesDiv.appendChild(document.createTextNode('Shop available. '));
    actionsDiv.appendChild(b); buttons.push(b);
  }
  if (landmark.river) {
    const b = document.createElement('button');
    b.textContent = 'River';
    b.addEventListener('click', () => { enterRiver(landmark.id); openRiverModal(landmark); });
    servicesDiv.appendChild(document.createTextNode('River nearby. '));
    actionsDiv.appendChild(b); buttons.push(b);
  }
  const restBtn = document.createElement('button');
  restBtn.textContent = 'Rest…';
  restBtn.addEventListener('click', () => {
    const days = Math.min(3, Math.max(1, parseInt(prompt('Rest how many days? (1-3)', '1'), 10) || 1));
    rest(days);
    addLog(`Rested ${days} day${days>1?'s':''} at ${landmark.name}.`, true);
    alert(`Rested ${days} day${days>1?'s':''}.`);
  });
  actionsDiv.appendChild(restBtn); buttons.push(restBtn);

  const leaveBtn = document.createElement('button');
  leaveBtn.textContent = 'Leave';
  leaveBtn.addEventListener('click', () => {
    closeLandmark();
    modal.remove();
    onClose && onClose();
  });
  actionsDiv.appendChild(leaveBtn); buttons.push(leaveBtn);

  function trapFocus() {
    modal.focus();
  }

  modal.tabIndex = -1;
  modal.addEventListener('keydown', (e) => {
    const idx = parseInt(e.key, 10) - 1;
    if (idx >= 0 && idx < buttons.length) {
      buttons[idx].click();
    }
    if (e.key === 'Tab') {
      const focusables = buttons;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
      }
    }
    if (e.key === 'Escape') {
      leaveBtn.click();
    }
  });

  trapFocus();
  if (buttons.length) buttons[0].focus();
  const gs = getState();
  if (gs.activeRiver && gs.activeRiver.landmarkId === landmark.id) {
    openRiverModal(landmark);
  }
}
