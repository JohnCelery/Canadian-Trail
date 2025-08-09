#!/usr/bin/env node
import assert from 'assert';

if (typeof global.localStorage === 'undefined') {
  global.localStorage = (() => {
    const store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      },
      removeItem: (k) => {
        delete store[k];
      }
    };
  })();
}

const GS = await import('../state/GameState.js');
const {
  startNewGame,
  random,
  setPace,
  setRations,
  advanceDay,
  continueGame,
  getState,
  setActiveEvent,
  addLog
} = GS;

const EE = await import('../systems/eventEngine.js');
const { eligibleEvents, pickWeighted, applyEffects, startEvent } = EE;
import events from '../data/events.json' assert { type: 'json' };
const LM = await import('../systems/landmarks.js');
const { checkArrival, landmarks: lmData } = LM;
const SH = await import('../systems/shop.js');
const { priceAt, applyPurchase, applySell } = SH;

// RNG determinism
startNewGame('Farmer', 123);
const seq1 = [random(), random(), random()];
startNewGame('Farmer', 123);
const seq2 = [random(), random(), random()];
assert.deepStrictEqual(seq1, seq2, 'RNG sequence mismatch');

// Ration consumption & pace health
startNewGame('Farmer', 456);
const st = getState();
st.inventory.food = 100;
setRations('Normal');
setPace('Grueling');
advanceDay();
const expectedFood = 100 - 2 * st.party.length;
assert.strictEqual(Math.round(st.inventory.food), expectedFood, 'Food consumption wrong');
st.party.forEach((m) => {
  assert.strictEqual(m.health, 98, 'Health penalty wrong');
});

// Autosave/load
startNewGame('Farmer', 789);
setPace('Strenuous');
advanceDay();
const snapshot = JSON.parse(JSON.stringify(getState()));
const curr = getState();
curr.pace = 'Steady';
const loaded = continueGame();
assert.deepStrictEqual(loaded, snapshot, 'Loaded state mismatch');

// eligibleEvents filters
const evts = [{ id: 'test', weight: 1, conditions: { mileMin: 0, mileMax: 100, season: ['Spring'] } }];
const es = eligibleEvents({ milesTraveled: 50, season: 'Spring', party: [{ health: 100 }] }, evts);
assert.strictEqual(es.length, 1, 'Event should be eligible');
const es2 = eligibleEvents({ milesTraveled: 150, season: 'Spring', party: [{ health: 100 }] }, evts);
assert.strictEqual(es2.length, 0, 'Event mile filter failed');
const es3 = eligibleEvents({ milesTraveled: 50, season: 'Winter', party: [{ health: 100 }] }, evts);
assert.strictEqual(es3.length, 0, 'Event season filter failed');

// pickWeighted deterministic
const rng = (() => { let s = 123; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };})();
const picked = pickWeighted(rng, [{ id: 'a', weight: 1 }, { id: 'b', weight: 3 }]);
assert.strictEqual(picked.id, 'b', 'Weighted pick failed');

// applyEffects basic resources
const testState = {
  inventory: { food: 0, money: 0 },
  party: [{ id: 'p', name: 'P', health: 50, statuses: [] }],
  milesTraveled: 0,
  milesRemaining: 100,
  date: '1848-03-01',
  day: 1,
  season: 'Spring'
};
applyEffects(testState, [
  { type: 'inventory', key: 'food', delta: 10 },
  { type: 'money', delta: 5 },
  { type: 'health', target: 'member', memberId: 'p', delta: 5 },
  { type: 'time', days: 2 },
  { type: 'distance', delta: 20 },
  { type: 'morale', delta: 1 }
], { log: () => {} });
assert.strictEqual(testState.inventory.food, 10, 'Inventory change failed');
assert.strictEqual(testState.inventory.money, 5, 'Money change failed');
assert.strictEqual(testState.party[0].health, 55, 'Health change failed');
assert.strictEqual(testState.day, 3, 'Time change failed');
assert.strictEqual(testState.milesTraveled, 20, 'Distance change failed');
assert.strictEqual(testState.milesRemaining, 80, 'Distance remaining failed');
assert.strictEqual(testState.morale, 1, 'Morale change failed');

// mortality effect
const deathState = {
  party: [{ id: 'ros', name: 'Ros', health: 100, statuses: [] }],
  epitaphs: {},
  inventory: {},
  date: '1848-03-01',
  day: 1,
  season: 'Spring',
  milesTraveled: 0,
  milesRemaining: 0
};
applyEffects(deathState, [{ type: 'mortality', memberId: 'ros', epitaphKey: 'death_ros_snakebite' }], { log: () => {} });
assert.strictEqual(deathState.party.length, 0, 'Mortality did not remove member');
assert.strictEqual(deathState.epitaphs.ros, 'death_ros_snakebite', 'Epitaph not set');


// landmark arrival
const landState = { progress: { milesTraveled: 0, landmarkIndex: 0 } };
let ar = checkArrival(landState);
assert.ok(ar.arrived && ar.landmark.id === lmData[0].id, 'Initial landmark arrival failed');
landState.progress.milesTraveled = 150;
ar = checkArrival(landState);
assert.ok(ar.arrived && ar.landmark.id === lmData[1].id, 'Second landmark arrival failed');

// price inflation monotonic
for (let i = 0; i < lmData.length - 1; i++) {
  const p1 = priceAt(i, 10);
  const p2 = priceAt(i + 1, 10);
  assert.ok(p2 >= p1, 'Price should not decrease along trail');
}

// applyPurchase/applySell
const shopState = { inventory: { money: 20, food: 0, bullets: 5 }, activeLandmark: { index: 0 } };
applyPurchase(shopState, [{ id: 'food', qty: 10 }]);
assert.strictEqual(shopState.inventory.food, 10, 'Purchase did not add items');
assert.ok(shopState.inventory.money >= 0, 'Money went negative');
applySell(shopState, [{ id: 'bullets', qty: 10 }]);
assert.strictEqual(shopState.inventory.bullets, 0, 'Sell did not clamp inventory');

// persistence of landmark index
startNewGame('Farmer', 555);
const ps = getState();
ps.progress.landmarkIndex = 2;
addLog('save'); // triggers save
const loaded2 = continueGame();
assert.strictEqual(loaded2.progress.landmarkIndex, 2, 'Landmark index not persisted');

// save/load activeEvent
startNewGame('Farmer', 999);
const state = getState();
startEvent(state, events[0]);
setActiveEvent(state.activeEvent);
const stageId = state.activeEvent.stageId;
const resumed = continueGame();
assert.ok(resumed.activeEvent, 'Active event not persisted');
assert.strictEqual(resumed.activeEvent.stageId, stageId, 'Active event stage mismatch');

console.log('All tests passed.');
