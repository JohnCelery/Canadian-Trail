import { travelDay, restDay } from '../systems/travel.js';
import { eligibleEvents, pickWeighted, startEvent as engineStartEvent, applyEffects, nextStage as engineNextStage } from '../systems/eventEngine.js';
import events from '../data/events.json' assert { type: 'json' };

import { checkArrival, landmarks } from "../systems/landmarks.js";

export let state = null;
let rng = Math.random;

const professionFunds = {
  Farmer: 500,
  Carpenter: 700,
  Banker: 1200
};

const defaultParty = [
  { id: 'merri', name: 'Merri-Ellen', age: 30, health: 100, statuses: [] },
  { id: 'mike', name: 'Mike', age: 32, health: 100, statuses: [] },
  { id: 'ros', name: 'Ros', age: 9, health: 100, statuses: [] },
  { id: 'jess', name: 'Jess', age: 6, health: 100, statuses: [] },
  { id: 'martha', name: 'Martha', age: 3, health: 100, statuses: [] },
  { id: 'rusty', name: 'Rusty', age: 1, health: 100, statuses: [] }
];
const totalMiles = landmarks[landmarks.length - 1].mile;

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

export function startNewGame(profession = "Farmer", seed = Date.now()) {
  const funds = professionFunds[profession] || professionFunds.Farmer;
  state = {
    day: 1,
    date: "1848-03-01",
    season: "Spring",
    profession,
    inventory: {
      food: 100,
      bullets: 0,
      medicine: 0,
      clothes: 0,
      spare_parts: 0,
      oxen: 0,
      money: funds
    },
    party: defaultParty.map((p) => ({ ...p })),
    milesTraveled: 0,
    milesRemaining: totalMiles,
    progress: { milesTraveled: 0, landmarkIndex: 0 },
    pace: "Steady",
    rations: "Normal",
    log: [],
    rngSeed: seed,
    activeEvent: null,
    activeLandmark: null,
    risks: {},
    morale: 0,
    mapFlags: {},
    epitaphs: {},
    meta: { daysSinceLastEvent: 0 }
  };
  rng = createRNG(seed);
  addLog("Game started", true);
  const arrival = checkArrival(state);
  if (arrival.arrived) {
    state.activeLandmark = { id: arrival.landmark.id, index: arrival.index };
    addLog(`Arrived at ${arrival.landmark.name}.`, true);
  }
  saveGame();
  return state;
}

export function continueGame() {
  const data = storage.getItem("gameState");
  if (!data) return null;
  state = JSON.parse(data);
  state.activeEvent = state.activeEvent || null;
  state.risks = state.risks || {};
  state.morale = state.morale || 0;
  state.mapFlags = state.mapFlags || {};
  state.epitaphs = state.epitaphs || {};
  state.meta = state.meta || { daysSinceLastEvent: 0 };
  state.party.forEach((p) => {
    p.statuses = p.statuses || [];
  });
  state.progress = state.progress || { milesTraveled: state.milesTraveled || 0, landmarkIndex: state.progress ? state.progress.landmarkIndex || 0 : 0 };
  state.progress.milesTraveled = state.milesTraveled || state.progress.milesTraveled || 0;
  state.activeLandmark = state.activeLandmark || null;
  state.inventory.food = state.inventory.food || 0;
  state.inventory.money = state.inventory.money || 0;
  state.inventory.bullets = state.inventory.bullets || 0;
  state.inventory.medicine = state.inventory.medicine || 0;
  state.inventory.clothes = state.inventory.clothes || 0;
  state.inventory.spare_parts = state.inventory.spare_parts || 0;
  state.inventory.oxen = state.inventory.oxen || 0;
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
  state.meta.daysSinceLastEvent += 1;
  addLog(`Traveled ${moved} miles.`, true);
  const arr = checkArrival(state);
  if (arr.arrived) {
    state.activeLandmark = { id: arr.landmark.id, index: arr.index };
    addLog(`Arrived at ${arr.landmark.name}.`, true);
  } else if (!state.activeEvent) {
    const chance = 0.2 + 0.1 * Math.min(state.meta.daysSinceLastEvent, 3);
    if (random() < chance) {
      const elig = eligibleEvents(state, events);
      if (elig.length) {
        const ev = pickWeighted(random, elig, 'weight');
        engineStartEvent(state, ev);
        addLog(ev.intro, true);
      }
    }
  }
  saveGame();
}

export function rest(days = 1) {
  for (let i = 0; i < days; i++) {
    restDay(state);
    incrementDate(1);
    state.meta.daysSinceLastEvent += 1;
    addLog('Rested.', true);
    if (!state.activeEvent) {
      const chance = 0.2 + 0.1 * Math.min(state.meta.daysSinceLastEvent, 3);
      if (random() < chance) {
        const elig = eligibleEvents(state, events);
        if (elig.length) {
          const ev = pickWeighted(random, elig, 'weight');
          engineStartEvent(state, ev);
          addLog(ev.intro, true);
        }
      }
    }
  }
  saveGame();
}

export function random() {
  const val = rng();
  saveGame();
  return val;
}

export function setActiveEvent(evt) {
  state.activeEvent = evt;
  saveGame();
}

export function endEvent() {
  state.activeEvent = null;
  state.meta.daysSinceLastEvent = 0;
  saveGame();
}

export function closeLandmark() {
  state.activeLandmark = null;
  saveGame();
}

export function chooseEventChoice(choiceId) {
  if (!state.activeEvent) return;
  const ctx = { log: (m) => addLog(m, true), rng: random, events: eventsById, endEvent };
  const event = eventsById[state.activeEvent.id];
  const stage = event.stages.find((s, i) => (s.id ?? i) === state.activeEvent.stageId);
  if (!stage) return;
  if (stage.followupRoll && !stage.choices) {
    const roll = random();
    let acc = 0;
    let picked = stage.followupRoll[stage.followupRoll.length - 1];
    for (const opt of stage.followupRoll) {
      acc += opt.chance;
      if (roll <= acc) {
        picked = opt;
        break;
      }
    }
    if (picked.textOnRoll) addLog(picked.textOnRoll, true);
    if (picked.effects) applyEffects(state, picked.effects, ctx);
    if (picked.next) {
      engineNextStage(state, picked.next, ctx);
    } else {
      endEvent();
    }
    saveGame();
    return;
  }
  const choice = stage.choices.find((c) => c.id === choiceId);
  if (!choice) return;
  addLog(choice.text, true);
  if (choice.effects) applyEffects(state, choice.effects, ctx);
  if (choice.next) {
    engineNextStage(state, choice.next, ctx);
  } else {
    endEvent();
  }
  saveGame();
}

const eventsById = Object.fromEntries(events.map((e) => [e.id, e]));

export function getState() {
  return state;
}

