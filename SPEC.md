# Frontier Run (Working Title) — SPEC.md

## Goal & Feel
A browser-based, single-player, day-by-day pioneer journey sim with:
- Linear route across historical landmarks; 10–20 miles/day pace tuning; ~4–6 months total run when playing “normally”.
- Resource pressure (food, bullets, spare parts, clothes, medicine, oxen), party health & diseases, river crossings, shops at forts.
- Random events with humor + peril; unique fail states (including character-specific deaths).
- Optional hunting mini-game.
- Distinct UI/art/text (no copying wording or art from any prior game). Historical place names are OK.

## Tech & Constraints
- Static site: HTML/CSS/JS (ES Modules), Canvas for hunting, LocalStorage saves.
- Must run via a static server (`npm run dev` → local server). No heavy build chain.
- Deterministic RNG with seed stored in save.

## Core Screens
1) **Title**: New Game / Continue.
2) **Family Setup**: default party prefilled (editable):
   - Merri‑Ellen (mom), Mike (dad), Ros (9), Jess (6), Martha (3), Rusty (1).
   - Optionally allow custom names/ages; default is the above.
   - Profession selects starting funds: Farmer 500, Carpenter 700, Banker 1200.
3) **Outfitter**: buy supplies; price inflation later on route.
4) **Travel (core loop)**:
   - Day, date/season, weather, terrain, miles traveled, miles remaining.
   - Pace: Steady / Strenuous / Grueling.
   - Rations: Meager / Normal / Generous.
   - Party health summary + per‑member statuses; event log; “Travel one day” (or “Advance”).
   - Actions: Hunt, Rest X days, Check Map, Manage Inventory.
5) **Landmarks (forts, natural features)**:
   - Shop (where available), talk flavor text, rest, move on.
6) **Rivers**:
   - Options: Ford, Caulk & float, Ferry (fee + possible wait).
   - Success odds scale with depth/width/weather; mishaps damage supplies/health.
7) **Hunting (Canvas)**:
   - Click/tap shoot; animals with different speeds/yield; bullets consumed; time limit.
   - Converts meat to food (with a daily spoilage cap to prevent trivializing food).
8) **Endings**:
   - Victory summary; death/game over with humorous epitaphs.

## Systems & Numbers (initial)
- **Daily pace**:
  - Steady: ~15 mi/day baseline, 0 health penalty.
  - Strenuous: +20% miles, −1 health/day to all.
  - Grueling: +35% miles, −2 health/day to all.
- **Rations (per person/day)**: Meager 1.5 lbs, Normal 2.0 lbs, Generous 2.5 lbs; affects morale/health recovery.
- **Weather/Season**: impacts health drift and event weights.
- **Events**: roll daily with weighted chances (common every 3–6 days on average). Multiple severities.
- **Diseases/status** (examples): dysentery, cholera, typhoid, snakebite, broken limb, exhaustion, frostbite.
- **Rivers**: Ford baseline 70% under 2ft; Caulk 85% any depth; Ferry 95% (fee, possible 1–3 day wait).
- **Economy**: Prices vary by landmark (slightly higher later).

## Data Files
- `data/landmarks.json` — ordered list with mile markers, services.
- `data/events.json` — weighted events (see advanced schema below).
- `data/items.json` — shop SKUs and base prices.
- `data/animals.json` — hunting targets (speed/yield).

## Save/Persist
- Auto-save end-of-day and on settings changes; manual save/load menu.
- Save includes RNG seed for reproducibility.

## Accessibility & UX
- Keyboard-nav; visible focus; ARIA landmarks; font-size toggle; color-contrast AA.
- “View Log” history; Pause.

## Non-goals (MVP)
- No backend; no accounts.
- No achievements/leaderboards.
