import { getState, random, addLog, exitRiver } from '../state/GameState.js';
import { applyEffects } from '../systems/eventEngine.js';
import { computeCrossingOdds, resolveCrossing } from '../systems/river.js';

export function openRiverModal(landmark) {
  const river = landmark.river;
  const state = getState();
  const odds = computeCrossingOdds(state, river);

  const overlay = document.createElement('div');
  overlay.id = 'river-modal';
  overlay.className = 'modal';
  overlay.setAttribute('role', 'dialog');
  overlay.tabIndex = -1;

  const box = document.createElement('div');
  box.className = 'modal-box';
  box.innerHTML = `
    <h2>${river.name} Crossing</h2>
    <p>Depth: ${river.depthFt.toFixed(1)} ft, Width: ${river.widthFt} ft</p>
    <p>Weather: ${state.weather || 'Clear'} | Season: ${state.season}</p>
  `;

  const btnWrap = document.createElement('div');
  const buttons = [];

  const fordBtn = document.createElement('button');
  fordBtn.textContent = `1. Ford (${Math.round(odds.ford * 100)}%)`;
  fordBtn.addEventListener('click', () => choose('ford'));
  btnWrap.appendChild(fordBtn);
  buttons.push(fordBtn);

  const caulkBtn = document.createElement('button');
  caulkBtn.textContent = `2. Caulk & float (${Math.round(odds.caulk * 100)}%)`;
  caulkBtn.addEventListener('click', () => choose('caulk'));
  btnWrap.appendChild(caulkBtn);
  buttons.push(caulkBtn);

  const ferryBtn = document.createElement('button');
  if (river.hasFerry) {
    ferryBtn.textContent = `3. Ferry $${river.ferryFee} (${Math.round(odds.ferry * 100)}%)`;
    ferryBtn.disabled = state.inventory.money < river.ferryFee;
    ferryBtn.addEventListener('click', () => choose('ferry'));
  } else {
    ferryBtn.textContent = '3. Ferry (unavailable)';
    ferryBtn.disabled = true;
  }
  btnWrap.appendChild(ferryBtn);
  buttons.push(ferryBtn);

  const backBtn = document.createElement('button');
  backBtn.textContent = '4. Back';
  backBtn.addEventListener('click', () => close());
  btnWrap.appendChild(backBtn);
  buttons.push(backBtn);

  box.appendChild(btnWrap);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function choose(choice) {
    const s = getState();
    const currentOdds = computeCrossingOdds(s, river);
    const result = resolveCrossing(s, choice, currentOdds, river, random);
    applyEffects(s, result.effects, { log: (m) => addLog(m, true), rng: random });
    const successVerbs = { ford: 'Forded', caulk: 'Caulked', ferry: 'Ferry' };
    const failVerbs = { ford: 'Ford', caulk: 'Caulking', ferry: 'Ferry' };
    if (result.success) {
      addLog(`${successVerbs[choice]} the ${river.name} (${river.depthFt.toFixed(1)} ft): success.`, true);
    } else {
      addLog(`${failVerbs[choice]} failed at the ${river.name}.`, true);
    }
    close();
  }

  function close() {
    exitRiver();
    document.body.removeChild(overlay);
  }

  overlay.addEventListener('keydown', (e) => {
    const idx = parseInt(e.key, 10) - 1;
    if (idx >= 0 && idx < buttons.length) {
      buttons[idx].click();
    }
    if (e.key === 'Tab') {
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
      }
    }
    if (e.key === 'Escape') {
      close();
    }
  });

  overlay.focus();
  buttons[0].focus();
}
