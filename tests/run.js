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
  getState
} = GS;

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

console.log('All tests passed.');
