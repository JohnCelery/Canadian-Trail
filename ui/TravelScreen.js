import { getState, setPace, setRations, advanceDay, rest } from '../state/GameState.js';

export function showTravelScreen() {
  const state = getState();
  document.body.innerHTML = '';
  const main = document.createElement('main');
  main.id = 'travel-screen';
  main.innerHTML = `
    <section id="top">
      <div id="date"></div>
      <div id="progress-bar"><div id="progress"></div></div>
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
      <p>Food: <span id="food"></span> lbs</p>
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

  const paceSel = main.querySelector('#pace');
  const rationSel = main.querySelector('#rations');
  paceSel.value = state.pace;
  rationSel.value = state.rations;

  paceSel.addEventListener('change', (e) => {
    setPace(e.target.value);
    render();
  });
  rationSel.addEventListener('change', (e) => {
    setRations(e.target.value);
    render();
  });
  main.querySelector('#travel-btn').addEventListener('click', () => {
    advanceDay();
    render();
  });
  main.querySelector('#rest-btn').addEventListener('click', () => {
    const days = parseInt(prompt('Rest how many days?', '1'), 10) || 1;
    rest(days);
    render();
  });

  function render() {
    const s = getState();
    main.querySelector('#date').textContent = `Day ${s.day} — ${s.date} (${s.season})`;
    const total = s.milesTraveled + s.milesRemaining;
    const pct = total ? (s.milesTraveled / total) * 100 : 0;
    main.querySelector('#progress').style.width = pct + '%';

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
  }

  render();
}

