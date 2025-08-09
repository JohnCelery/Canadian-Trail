# AGENTS.md

## Project rules
- Static HTML/CSS/JS with ES Modules. No bundler. Use a simple local static server for dev.
- Data must be JSON under /data. Images under /assets/img. 
- Deterministic RNG with seed; include seed in saves.

## Tasks
1) Scaffold per SPEC.md (files, folders, basic Title screen).
2) Implement GameState + save/load + seeded RNG + Travel loop.
3) Implement Event Engine per SPEC_ADVANCED_EVENTS.md (multi-stage choices).
4) Implement Landmarks/Shops, Rivers, Hunting (Canvas); wire items/animals JSON.
5) Add accessibility; write `tests/run.js` covering core reducers/event logic.

## Commands to run
- Dev server: `npm run dev` (use any zero-dependency static server).
- Tests: `npm test` (Node script; no external test framework).

## Review criteria
- Pass Acceptance Tests.
- Keep total repo (without images/audio) under ~2–3 MB for MVP.
