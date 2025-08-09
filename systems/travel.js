export function travelDay(state) {
  const paceMultiplier = {
    Steady: 1,
    Strenuous: 1.2,
    Grueling: 1.35
  };
  const rationRates = {
    Meager: 1.5,
    Normal: 2.0,
    Generous: 2.5
  };
  const paceHealth = {
    Steady: 0,
    Strenuous: -1,
    Grueling: -2
  };

  const miles = Math.round(15 * paceMultiplier[state.pace]);
  state.milesTraveled += miles;
  state.progress = state.progress || { milesTraveled: 0, landmarkIndex: 0 };
  state.progress.milesTraveled = state.milesTraveled;
  state.milesRemaining = Math.max(0, state.milesRemaining - miles);

  const foodNeeded = rationRates[state.rations] * state.party.length;
  state.inventory.food -= foodNeeded;

  let healthDelta = paceHealth[state.pace];
  if (state.inventory.food <= 0) {
    healthDelta -= 2;
    state.inventory.food = 0;
  }

  state.party.forEach((m) => {
    m.health = clamp(m.health + healthDelta, 0, 100);
  });
}

export function restDay(state) {
  const rationRates = {
    Meager: 1.5,
    Normal: 2.0,
    Generous: 2.5
  };
  const foodNeeded = rationRates[state.rations] * state.party.length;
  state.inventory.food -= foodNeeded;
  if (state.inventory.food <= 0) {
    state.inventory.food = 0;
    state.party.forEach((m) => {
      m.health = clamp(m.health - 2, 0, 100);
    });
  } else {
    state.party.forEach((m) => {
      m.health = clamp(m.health + 1, 0, 100);
    });
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

