import { getState, setPace, setRations, advanceDay, rest } from '../state/GameState.js';
import { showEventModal } from './EventModal.js';
import { loadJSON } from '../systems/jsonLoader.js';
const events = await loadJSON('../data/events.json', import.meta.url);
import { getNextLandmark, milesToNext, landmarks } from "../systems/landmarks.js";
import { showLandmarkScreen } from "./LandmarkScreen.js";
import { getImage, getMeta } from '../systems/assets.js';

const eventMap = Object.fromEntries(events.map((e) => [e.id, e]));

export function showTravelScreen() {
  const state = getState();
  document.body.innerHTML = '';

  const bg = document.createElement('div');
  bg.id = 'travel-bg';
  bg.className = 'scene-bg';
  const bgImg = getImage('scenes.travel');
  const bgMeta = getMeta('scenes.travel');
  if (bgImg && bgMeta) {
    bg.style.width = bgMeta.w + 'px';
    bg.style.height = bgMeta.h + 'px';
    bgImg.classList.add('pixelated');
    bg.appendChild(bgImg);
  }
  document.body.appendChild(bg);

  const main = document.createElement('main');
  main.id = 'travel-screen';
  main.innerHTML = `
    <section id="top">
      <div id="date"></div>
      <div id="progress-bar"><div id="progress"></div></div>
      <div id="next-landmark"></div>
      <div id="settings">
        <label>Pace
          <select id="pace">
            <option value="Steady">Steady</option>
            <option value="Strenuous">Strenuous</option>
            <option value="Grueling">Grueling</option>
          </select>
        </label>
        <label>Rations
          <select id="rations">
            <option value="Meager">Meager</option>
            <option value="Normal">Normal</option>
            <option value="Generous">Generous</option>
          </select>
        </label>
      </div>
    </section>
    <section id="party">
      <h2>Party</h2>
      <ul id="party-list"></ul>
    </section>
    <section id="inventory">
      <h2>Inventory</h2>
      <p><span id="food-icon" class="img-slot"></span> Food: <span id="food"></span> lbs</p>
    </section>
    <section id="log-section">
      <h2>Log</h2>
      <div id="log" tabindex="0"></div>
    </section>
    <section id="actions">
      <button id="travel-btn">Travel one day</button>
      <button id="rest-btn">Rest</button>
      <button id="hunt-btn" disabled>Hunt</button>
      <button id="map-btn" disabled>Map</button>
    </section>
  `;
  document.body.appendChild(main);

  const foodIcon = main.querySelector('#food-icon');
  const foodImg = getImage('ui.icon_food');
  const foodMeta = getMeta('ui.icon_food');
  if (foodIcon && foodImg && foodMeta) {
    foodIcon.style.width = foodMeta.w + 'px';
    foodIcon.style.height = foodMeta.h + 'px';
    foodImg.classList.add('pixelated');
    foodIcon.appendChild(foodImg);
  }

  const paceSel = main.querySelector('#pace');
  const rationSel = main.querySelector('#rations');
  paceSel.value = state.pace;
  rationSel.value = state.rations;

  paceSel.addEventListener('change', (e) => {
    setPace(e.target.value);
    render();
    checkEvent();
  });
  rationSel.addEventListener('change', (e) => {
    setRations(e.target.value);
    render();
    checkEvent();
  });
  main.querySelector('#travel-btn').addEventListener('click', () => {
    advanceDay();
    render();
    checkEvent();
    checkLandmark();
  });
  main.querySelector('#rest-btn').addEventListener('click', () => {
    const days = parseInt(prompt('Rest how many days?', '1'), 10) || 1;
    rest(days);
    render();
    checkEvent();
    checkLandmark();
  });

  function render() {
    const s = getState();
    main.querySelector('#date').textContent = `Day ${s.day} — ${s.date} (${s.season})`;
    const total = s.milesTraveled + s.milesRemaining;
    const pct = total ? (s.milesTraveled / total) * 100 : 0;
    main.querySelector('#progress').style.width = pct + '%';
    const next = getNextLandmark(s);
    const nextDiv = main.querySelector('#next-landmark');
    if (next) {
      nextDiv.textContent = `Next landmark: ${next.name} — ${milesToNext(s)} miles`;
    } else {
      nextDiv.textContent = 'End of trail';
    }

    const list = main.querySelector('#party-list');
    list.innerHTML = '';
    s.party.forEach((m) => {
      const li = document.createElement('li');
      li.textContent = `${m.name} (${m.age}) — ${Math.round(m.health)}`;
      list.appendChild(li);
    });
    main.querySelector('#food').textContent = Math.round(s.inventory.food);
    const logDiv = main.querySelector('#log');
    logDiv.innerHTML = '';
    s.log.slice(-20).forEach((entry) => {
      const p = document.createElement('div');
      p.textContent = entry;
      logDiv.appendChild(p);
    });
    logDiv.scrollTop = logDiv.scrollHeight;

    const disabled = !!s.activeEvent || !!s.activeLandmark;
    main.querySelector('#travel-btn').disabled = disabled;
    main.querySelector('#rest-btn').disabled = disabled;
  }

  function checkEvent() {
    const s = getState();
    if (!s.activeEvent) return;
    const ev = eventMap[s.activeEvent.id];
    const stage = ev.stages.find((st, i) => (st.id ?? i) === s.activeEvent.stageId);
    showEventModal(ev, stage, () => {
      render();
      checkEvent();
    });
  }

  function checkLandmark() {
    const s = getState();
    if (!s.activeLandmark) return;
    if (document.getElementById("landmark-modal")) return;
    const lm = landmarks.find(l => l.id === s.activeLandmark.id);
    if (lm) {
      showLandmarkScreen({ ...lm, index: s.activeLandmark.index }, () => {
        render();
      });
    }
  }

  render();
  checkEvent();
  checkLandmark();
}
