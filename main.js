// main.js

import { startNewGame, continueGame } from './state/GameState.js';
import { showTravelScreen } from './ui/TravelScreen.js';
import { loadJSON, showInitError } from './systems/jsonLoader.js';
import { loadAssets, getImage, getMeta } from './systems/assets.js';

async function init() {
  // 1) Load manifest in a cross-browser way and preload assets
  const manifest = await loadJSON('./data/manifest.json', import.meta.url);
  await loadAssets(manifest);

  // 2) Title background (safe even if the key doesn't exist; placeholders will render)
  const bgContainer = document.getElementById('title-bg');
  const bgImg = getImage('scenes.title');   // keep your existing manifest key
  const bgMeta = getMeta('scenes.title');
  if (bgContainer && bgImg) {
    bgImg.classList.add('pixelated');
    // Use meta sizes if available; otherwise fall back to the image's natural size
    const w = (bgMeta && (bgMeta.w || bgMeta.frameWidth)) || bgImg.naturalWidth || 0;
    const h = (bgMeta && (bgMeta.h || bgMeta.frameHeight)) || bgImg.naturalHeight || 0;
    if (w && h) {
      bgContainer.style.width = `${w}px`;
      bgContainer.style.height = `${h}px`;
    }
    bgContainer.appendChild(bgImg);
  }

  // 3) Wire buttons AFTER assets/data are ready
  const newGameBtn = document.getElementById('new-game');
  const continueBtn = document.getElementById('continue');

  if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
      startNewGame('Farmer'); // default profession; adjust later via UI if desired
      showTravelScreen();
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      if (continueGame()) {
        showTravelScreen();
      } else {
        // Inline toast instead of alert (friendlier in iframes/previews)
        const note = document.createElement('div');
        note.textContent = 'No saved game found.';
        note.style.cssText =
          'position:fixed;bottom:12px;left:12px;background:#333;color:#fff;padding:8px 10px;border-radius:6px;font:12px system-ui;z-index:9999';
        document.body.appendChild(note);
        setTimeout(() => note.remove(), 2000);
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch(showInitError);
});
