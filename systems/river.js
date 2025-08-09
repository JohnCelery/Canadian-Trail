export function computeCrossingOdds(state, riverMeta) {
  const depth = riverMeta.depthFt || 0;
  const width = riverMeta.widthFt || 0;
  let ford = 0.7;
  let caulk = 0.85;
  let ferry = 0.95;

  // depth penalties
  ford -= 0.10 * Math.max(0, depth - 2);
  caulk -= 0.05 * Math.max(0, depth - 3);

  // width penalties
  if (width > 250) {
    ford -= 0.05;
    caulk -= 0.02;
  }

  const weather = (state.weather || '').toLowerCase();
  if (weather === 'rain' || weather === 'rainy') {
    ford -= 0.10; caulk -= 0.06; ferry -= 0.03;
  } else if (weather === 'snow' || weather === 'snowy') {
    ford -= 0.12; caulk -= 0.08; ferry -= 0.04;
  } else if (weather === 'cold') {
    ford -= 0.05; caulk -= 0.03; ferry -= 0.01;
  }

  let odds = { ford, caulk, ferry };

  // risk buffs
  const buffStr = state.risks && state.risks.riverAccidentChance;
  if (buffStr) {
    const m = /([+-]?\d+)%/.exec(buffStr);
    if (m) {
      const buff = parseInt(m[1], 10) / 100;
      odds = Object.fromEntries(Object.entries(odds).map(([k, v]) => {
        const fail = 1 - v;
        const newFail = fail * (1 + buff);
        return [k, 1 - newFail];
      }));
    }
  }

  for (const k in odds) {
    odds[k] = clamp(odds[k], 0.05, 0.98);
  }
  return odds;
}

export function resolveCrossing(state, choice, odds, riverMeta, rng = Math.random) {
  const res = { success: false, effects: [] };
  const chance = odds[choice] || 0;
  const roll = rng();
  if (choice === 'ferry') {
    const fee = Math.min(riverMeta.ferryFee || 0, (state.inventory && state.inventory.money) || 0);
    if (fee > 0) res.effects.push({ type: 'money', delta: -fee });
    const waitDays = 1 + Math.floor(rng() * 3);
    res.effects.push({ type: 'time', days: waitDays });
    res.waitDays = waitDays;
    res.success = roll < chance;
    if (!res.success) {
      const foodLossPct = 0.10 + rng() * 0.20;
      const foodLoss = Math.round((state.inventory.food || 0) * foodLossPct);
      if (foodLoss) res.effects.push({ type: 'inventory', key: 'food', delta: -Math.min(foodLoss, state.inventory.food || 0) });
      const spareLoss = rng() < 0.5 ? 1 : 0;
      if (spareLoss) res.effects.push({ type: 'inventory', key: 'spare_parts', delta: -Math.min(spareLoss, state.inventory.spare_parts || 0) });
      const clothesLoss = rng() < 0.5 ? 1 : 0;
      if (clothesLoss) res.effects.push({ type: 'inventory', key: 'clothes', delta: -Math.min(clothesLoss, state.inventory.clothes || 0) });
      const h = 1 + Math.floor(rng() * 5);
      res.effects.push({ type: 'health', target: 'party', delta: -h });
    }
    return res;
  }

  res.success = roll < chance;
  if (res.success) {
    const dayLoss = Math.floor(rng() * 2);
    if (dayLoss) res.effects.push({ type: 'time', days: dayLoss });
    return res;
  }

  const severeChance = Math.min(0.2 + 0.15 * Math.max(0, (riverMeta.depthFt || 0) - 2) + (riverMeta.widthFt > 300 ? 0.1 : 0), 0.9);
  const severe = rng() < severeChance;
  if (!severe) {
    const foodLossPct = 0.10 + rng() * 0.20;
    const foodLoss = Math.round((state.inventory.food || 0) * foodLossPct);
    if (foodLoss) res.effects.push({ type: 'inventory', key: 'food', delta: -Math.min(foodLoss, state.inventory.food || 0) });
    const spareLoss = rng() < 0.5 ? 1 : 0;
    if (spareLoss) res.effects.push({ type: 'inventory', key: 'spare_parts', delta: -Math.min(spareLoss, state.inventory.spare_parts || 0) });
    const h = 1 + Math.floor(rng() * 5);
    res.effects.push({ type: 'health', target: 'party', delta: -h });
  } else {
    const foodLossPct = 0.30 + rng() * 0.40;
    const foodLoss = Math.round((state.inventory.food || 0) * foodLossPct);
    if (foodLoss) res.effects.push({ type: 'inventory', key: 'food', delta: -Math.min(foodLoss, state.inventory.food || 0) });
    const clothesLoss = Math.floor(rng() * 3);
    if (clothesLoss) res.effects.push({ type: 'inventory', key: 'clothes', delta: -Math.min(clothesLoss, state.inventory.clothes || 0) });
    const oxenLoss = Math.floor(rng() * 3);
    if (oxenLoss) res.effects.push({ type: 'inventory', key: 'oxen', delta: -Math.min(oxenLoss, state.inventory.oxen || 0) });
    const h = 10 + Math.floor(rng() * 16);
    res.effects.push({ type: 'health', target: 'party', delta: -h });
    if (rng() < 0.1 && (state.party && state.party.length)) {
      res.effects.push({ type: 'mortality', memberId: 'random', cause: 'river' });
    }
  }
  return res;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
