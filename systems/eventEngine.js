export function eligibleEvents(state, events = []) {
  return events.filter((ev) => {
    const c = ev.conditions || {};
    if (c.mileMin != null && state.milesTraveled < c.mileMin) return false;
    if (c.mileMax != null && state.milesTraveled > c.mileMax) return false;
    if (c.season && c.season.length && !c.season.map((s)=>s.toLowerCase()).includes(state.season.toLowerCase())) return false;
    if (c.terrain && c.terrain.length && c.terrain.indexOf(state.terrain) === -1) return false;
    if (c.requiresStatus) {
      const statuses = new Set(state.statuses || []);
      for (const st of c.requiresStatus) if (!statuses.has(st)) return false;
    }
    if (c.excludesStatus) {
      const statuses = new Set(state.statuses || []);
      for (const st of c.excludesStatus) if (statuses.has(st)) return false;
    }
    if (c.requiresFlags) {
      const flags = state.mapFlags || {};
      for (const k in c.requiresFlags) if (flags[k] !== c.requiresFlags[k]) return false;
    }
    if (c.minPartyHealthAvg != null) {
      const avg = state.party.reduce((a, m) => a + m.health, 0) / state.party.length;
      if (avg < c.minPartyHealthAvg) return false;
    }
    return true;
  });
}

export function pickWeighted(rng, list, weightKey = 'weight') {
  const total = list.reduce((s, it) => s + (it[weightKey] || 0), 0);
  let r = rng() * total;
  for (const it of list) {
    r -= it[weightKey] || 0;
    if (r <= 0) return it;
  }
  return list[list.length - 1];
}

export function startEvent(state, event) {
  const firstStage = event.stages[0];
  state.activeEvent = { id: event.id, stageId: firstStage.id || 0, vars: {} };
  state.meta = state.meta || { daysSinceLastEvent: 0 };
  state.meta.daysSinceLastEvent = 0;
  return state;
}

export function applyEffects(state, effects = [], ctx = {}) {
  const log = ctx.log || (() => {});
  for (const eff of effects) {
    switch (eff.type) {
      case 'resource':
      case 'inventory': {
        if (!state.inventory) state.inventory = {};
        const prev = state.inventory[eff.key] || 0;
        state.inventory[eff.key] = prev + (eff.delta || 0);
        log(`${eff.delta >= 0 ? 'Gained' : 'Lost'} ${Math.abs(eff.delta)} ${eff.key}.`);
        break;
      }
      case 'money': {
        if (!state.inventory) state.inventory = {};
        state.inventory.money = (state.inventory.money || 0) + (eff.delta || 0);
        log(`${eff.delta >= 0 ? 'Gained' : 'Lost'} $${Math.abs(eff.delta)}.`);
        break;
      }
      case 'health': {
        const delta = eff.delta || 0;
        const clamp = (v) => Math.max(0, Math.min(100, v));
        if (eff.target === 'member') {
          const m = state.party.find((p) => p.id === eff.memberId);
          if (m) {
            m.health = clamp(m.health + delta);
            log(`${m.name}'s health ${delta >= 0 ? 'improved' : 'dropped'} ${Math.abs(delta)}.`);
          }
        } else if (eff.target === 'party' || eff.target === 'all') {
          state.party.forEach((m) => {
            m.health = clamp(m.health + delta);
          });
          log(`Party health ${delta >= 0 ? 'improved' : 'dropped'} ${Math.abs(delta)}.`);
        }
        break;
      }
      case 'status': {
        const { action, status, target, memberId } = eff;
        const apply = (m) => {
          m.statuses = m.statuses || [];
          if (action === 'add' && !m.statuses.includes(status)) m.statuses.push(status);
          if (action === 'remove') m.statuses = m.statuses.filter((s) => s !== status);
        };
        if (target === 'member') {
          const m = state.party.find((p) => p.id === memberId);
          if (m) apply(m);
        } else if (target === 'party' || target === 'all') {
          state.party.forEach(apply);
        }
        break;
      }
      case 'time': {
        const days = eff.days || 0;
        const d = new Date(state.date);
        d.setDate(d.getDate() + days);
        state.date = d.toISOString().slice(0, 10);
        state.day += days;
        const m = d.getMonth() + 1;
        if (m <= 2 || m === 12) state.season = 'Winter';
        else if (m <= 5) state.season = 'Spring';
        else if (m <= 8) state.season = 'Summer';
        else state.season = 'Fall';
        log(`Lost ${days} days.`);
        break;
      }
      case 'distance': {
        const miles = eff.delta || 0;
        state.milesTraveled += miles;
        state.progress = state.progress || { milesTraveled: state.milesTraveled, landmarkIndex: 0 };
        state.progress.milesTraveled = state.milesTraveled;
        state.milesRemaining = Math.max(0, state.milesRemaining - miles);
        log(`Distance changed by ${miles} miles.`);
        break;
      }
      case 'morale': {
        state.morale = (state.morale || 0) + (eff.delta || 0);
        log(`Morale ${eff.delta >= 0 ? 'rose' : 'fell'} ${Math.abs(eff.delta)}.`);
        break;
      }
      case 'mapFlag': {
        state.mapFlags = state.mapFlags || {};
        state.mapFlags[eff.key] = eff.value;
        break;
      }
      case 'riskBuff': {
        state.risks = state.risks || {};
        state.risks[eff.key] = eff.value;
        break;
      }
      case 'mortality': {
        let member = null;
        if (eff.memberId === 'random') {
          if (state.party.length) {
            const idx = Math.floor((ctx.rng ? ctx.rng() : Math.random()) * state.party.length);
            member = state.party[idx];
          }
        } else {
          member = state.party.find((p) => p.id === eff.memberId);
        }
        if (member) {
          state.party = state.party.filter((m) => m !== member);
          state.epitaphs = state.epitaphs || {};
          const key = eff.epitaphKey || `death_${member.id}_${eff.cause || 'unknown'}`;
          state.epitaphs[member.id] = key;
          log(`${member.name} has died.`);
        }
        break;
      }
    }
  }
  return state;
}

export function nextStage(state, stageOrId, ctx = {}) {
  const events = ctx.events || {};
  const event = events[state.activeEvent.id];
  if (!event) return state;
  let stage = null;
  if (typeof stageOrId === 'object') stage = stageOrId;
  else {
    stage = event.stages.find((s) => s.id === stageOrId) || event.stages[stageOrId];
  }
  if (!stage) return state;
  state.activeEvent.stageId = stage.id || event.stages.indexOf(stage);
  if (stage.text) ctx.log && ctx.log(stage.text);
  if (stage.effects) applyEffects(state, stage.effects, ctx);
  if (!stage.choices && !stage.followupRoll) {
    ctx.endEvent && ctx.endEvent();
  }
  return state;
}

