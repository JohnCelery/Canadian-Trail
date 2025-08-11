// main.js — resilient boot: wire buttons first, load heavy modules on demand

function toast(msg) {
  const note = document.createElement('div');
  note.textContent = msg;
  note.style.cssText =
    'position:fixed;bottom:12px;left:12px;background:#333;color:#fff;padding:8px 10px;border-radius:6px;font:12px system-ui;z-index:9999';
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 2000);
}

function showErrorBanner(msg) {
  let el = document.getElementById('boot-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'boot-error';
    el.setAttribute('role', 'alert');
    el.style.cssText =
      'position:fixed;top:0;left:0;right:0;background:#b00020;color:#fff;padding:8px 12px;font:14px/1.4 system-ui;z-index:10000';
    document.body.appendChild(el);
  }
  el.textContent = msg;
}

function showLoading(flag) {
  let el = document.getElementById('boot-loading');
  if (flag) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'boot-loading';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText =
        'position:fixed;bottom:12px;right:12px;background:#0008;color:#fff;padding:8px 10px;border-radius:6px;font:12px system-ui;z-index:9999';
      el.textContent = 'Loading…';
      document.body.appendChild(el);
    }
  } else if (el) {
    el.remove();
  }
}

async function tryImport(paths) {
  // Try a list of candidate paths (handles case / folder mismatches)
  for (const p of paths) {
    try {
      return await import(p);
    } catch (_) {}
  }
  throw new Error('Failed to import any of: ' + paths.join(', '));
}

async function prepareAssets() {
  try {
    const [{ loadJSON }, assets] = await Promise.all([
      tryImport(['./systems/jsonLoader.js']).then((m) => ({ loadJSON: m.loadJSON })),
      tryImport(['./systems/assets.js', './system/assets.js']), // tolerate "systems" vs "system"
    ]);

    const manifest = await loadJSON('./data/manifest.json', import.meta.url);
    await assets.loadAssets(manifest);

    // Best-effort title background (doesn't block UI)
    const bgContainer = document.getElementById('title-bg');
    if (bgContainer) {
      const img = assets.getImage('scenes.title');
      const meta = assets.getMeta('scenes.title');
      if (img && meta) {
        img.classList.add('pixelated');
        if (meta.w && meta.h) {
          bgContainer.style.width = meta.w + 'px';
          bgContainer.style.height = meta.h + 'px';
        }
        bgContainer.appendChild(img);
      }
    }
  } catch (err) {
    console.error(err);
    showErrorBanner('Some assets failed to preload. You can still start the game.');
  }
}

function wireTitle() {
  const newBtn = document.getElementById('new-game');
  const contBtn = document.getElementById('continue');
  if (!newBtn || !contBtn) {
    showErrorBanner('Title buttons not found in DOM.');
    return;
  }

  newBtn.addEventListener('click', async () => {
    try {
      showLoading(true);
      const GS = await tryImport(['./state/GameState.js', './state/gamestate.js']);
      const TS = await tryImport(['./ui/TravelScreen.js', './ui/travelscreen.js']);
      GS.startNewGame('Farmer');
      TS.showTravelScreen();
    } catch (err) {
      console.error(err);
      showErrorBanner('Failed to start a new game. See console for details.');
    } finally {
      showLoading(false);
    }
  });

  contBtn.addEventListener('click', async () => {
    try {
      showLoading(true);
      const GS = await tryImport(['./state/GameState.js', './state/gamestate.js']);
      const s = GS.continueGame();
      if (!s) {
        toast('No saved game found.');
        return;
      }
      const TS = await tryImport(['./ui/TravelScreen.js', './ui/travelscreen.js']);
      TS.showTravelScreen();
    } catch (err) {
      console.error(err);
      showErrorBanner('Failed to continue saved game. See console for details.');
    } finally {
      showLoading(false);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  wireTitle();      // wire buttons immediately
  prepareAssets();  // start preloading in the background
});
