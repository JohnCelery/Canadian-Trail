# Frontier Run (working title)

A web-based, day-by-day pioneer journey inspired by the classic Oregon Trail loop—**travel → events → shops → rivers → hunting**—with similar flow, pacing, and difficulty, but entirely new text, UI, and art.

## Status
MVP under active development with OpenAI Codex (or Cursor). Design and test criteria live in:
- [SPEC.md](./SPEC.md)
- [SPEC_ADVANCED_EVENTS.md](./SPEC_ADVANCED_EVENTS.md)
- [ACCEPTANCE_TESTS.md](./ACCEPTANCE_TESTS.md)
- [AGENTS.md](./AGENTS.md)
- [CONTENT_GUIDE.md](./CONTENT_GUIDE.md)

## Default party (editable)
Merri-Ellen (mom), Mike (dad), Ros (9), Jess (6), Martha (3), Rusty (1).

## Tech
Static site: **HTML/CSS/JS (ES Modules)**. Canvas for hunting. LocalStorage for saves. No frameworks or bundlers.

## Run locally
Modern browsers require HTTP for ES modules and JSON fetches. Serve the folder, then open `index.html`:

```bash
# Option A: Python 3 (usually preinstalled)
python3 -m http.server 5173

# Option B: Node (if installed)
npx http-server -p 5173

Visit http://localhost:5173

Dev scripts (target)

Codex will add:
	•	npm run dev — starts a static server (prefers Python; falls back to Node http-server).
	•	npm test — Node script that checks reducers, event filtering, mortality routing, and a seeded multi-day run.

Target layout

/assets/img/{ui,scene,sprites}
/assets/audio
/data/{events.json,landmarks.json,items.json,animals.json}
/state  /systems  /ui
index.html  styles.css  main.js

Content & art
	•	Events live in /data/events.json (schema in SPEC_ADVANCED_EVENTS.md), supporting multi-stage dialogue, conditional branches, and member-specific outcomes.
	•	Pixel-art PNGs; keep total repo size small (≤ ~2–3 MB for MVP). Sprite sheets: 4 frames @ ~8 fps.

Using Codex (or Cursor)
	•	The agent reads repo files and follows AGENTS.md for tasks/rules.
	•	Start with the Scaffold task, then proceed through the tasks listed in AGENTS.md.
	•	Internet access for the agent is off by default; enable only if needed (this project is designed as a static site).

Hosting
	•	GitHub Pages (Settings → Pages → Deploy from main root) or any static host (Netlify/Vercel). No backend required.

IP note

We mirror the feel and pacing of the classic, but all text, UI, art, and code here are original. Historical place names are factual.

License

MIT 

