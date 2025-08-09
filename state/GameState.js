import { travelDay, restDay } from '../systems/travel.js';

export let state = null;
let rng = Math.random;

const professionFunds = {
  Farmer: 500,
  Carpenter: 700,
  Banker: 1200
};

const defaultParty = [
  { name: 'Merri-Ellen', age: 30, health: 100 },
  { name: 'Mike', age: 32, health: 100 },
  { name: 'Ros', age: 9, health: 100 },
  { name: 'Jess', age: 6, health: 100 },
  { name: 'Martha', age: 3, health: 100 },
  { name: 'Rusty', age: 1, health: 100 }
];

const storage = typeof localStorage !== 'undefined'
  ? localStorage
  : (() => {
      const mem = {};
      return {
        getItem: (k) => (k in mem ? mem[k] : null),
        setItem: (k, v) => {
          mem[k] = String(v);
        },
        removeItem: (k) => {
          delete mem[k];
        }
      };
    })();

function saveGame() {
  if (state) {
    storage.setItem('gameState', JSON.stringify(state));
  }
}

function createRNG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    state.rngSeed = s;
    return s / 4294967296;
  };
}

function computeSeason(dateStr) {
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  if (m <= 2 || m === 12) return 'Winter';
  if (m <= 5) return 'Spring';
  if (m <= 8) return 'Summer';
  return 'Fall';
}

export function startNewGame(profession = 'Farmer', seed = Date.now()) {
  const funds = professionFunds[profession] || professionFunds.Farmer;
  state = {
    day: 1,
    date: '1848-03-01',
    season: 'Spring',
    profession,
    inventory: {
      food: 100,
      money: funds
    },
    party: defaultParty.map((p) => ({ ...p })),
    milesTraveled: 0,
    milesRemaining: 2000,
    pace: 'Steady',
    rations: 'Normal',
    log: [],
    rngSeed: seed
  };
  rng = createRNG(seed);
  addLog('Game started', true);
  saveGame();
  return state;
}

export function continueGame() {
  const data = storage.getItem('gameState');
  if (!data) return null;
  state = JSON.parse(data);
  rng = createRNG(state.rngSeed);
  return state;
}

export function setPace(pace) {
  state.pace = pace;
  saveGame();
}

export function setRations(rations) {
  state.rations = rations;
  saveGame();
}

export function addLog(message, skipSave = false) {
  state.log.push(message);
  if (!skipSave) saveGame();
}

function incrementDate(days) {
  const d = new Date(state.date);
  d.setDate(d.getDate() + days);
  state.date = d.toISOString().slice(0, 10);
  state.day += days;
  state.season = computeSeason(state.date);
}

export function advanceDay() {
  const before = state.milesTraveled;
  travelDay(state);
  const moved = state.milesTraveled - before;
  incrementDate(1);
  addLog(`Traveled ${moved} miles.`, true);
  saveGame();
}

export function rest(days = 1) {
  for (let i = 0; i < days; i++) {
    restDay(state);
    incrementDate(1);
    addLog('Rested.', true);
  }
  saveGame();
}

export function random() {
  const val = rng();
  saveGame();
  return val;
}

export function getState() {
  return state;
}

