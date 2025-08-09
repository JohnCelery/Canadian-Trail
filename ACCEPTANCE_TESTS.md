# Acceptance Tests

## Smoke
- `npm run dev` starts a static server; the site loads with no 404s.
- New Game → default family → Outfitter → Travel works end-to-end.

## Core Loop
- Food decreases based on rations; health drops when food ≤ 0.
- Events trigger on average every 3–6 days (seeded runs reproducible).
- Pace affects distance & health as per SPEC.
- Landmarks appear at correct mile markers; shops load items & prices.
- Rivers show three options with odds & consequences; failures can damage items/health.

## Hunting
- Entering hunting consumes bullets; clicking animals can hit; yields food with spoilage cap.

## Save/Load
- Auto-save at day end; "Continue" resumes same state after refresh.
- Manual Save/Load restores exact state.

## Accessibility
- All controls operable by keyboard; focus visible; ARIA roles present.

## Advanced Events
- Engine supports multi-stage event graphs (stages/choices/conditional follow-ups).
- Member-targeted mortality yields the correct unique epitaph.

## Performance & Browser
- Hunting renders smoothly; UI updates under 16ms on a mid laptop.
- Works in latest Chrome/Edge/Firefox/Safari.

## Test Harness
- Provide `tests/run.js` (Node, built-in `assert`) covering:
  - RNG determinism, pace/ration math, event condition filtering, mortality routing.
  - Run via `npm test`.
