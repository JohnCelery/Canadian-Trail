import { startNewGame, continueGame } from './state/GameState.js';
import { showTravelScreen } from './ui/TravelScreen.js';
import { loadJSON, showInitError } from './systems/jsonLoader.js';
import { loadJSON } from './systems/jsonLoader.js';

async function init() {
  const manifest = await loadJSON('./data/manifest.json', import.meta.url);
  await loadAssets(manifest);

  const bgContainer = document.getElementById('title-bg');
  const bgImg = getImage('scenes.title');
  const bgMeta = getMeta('scenes.title');
  if (bgContainer && bgImg && bgMeta) {
    bgContainer.style.width = bgMeta.w + 'px';
    bgContainer.style.height = bgMeta.h + 'px';
    bgImg.classList.add('pixelated');
    bgContainer.appendChild(bgImg);
  }

  const newGameBtn = document.getElementById('new-game');
  const continueBtn = document.getElementById('continue');

  newGameBtn.addEventListener('click', () => {
    startNewGame('Farmer');
    showTravelScreen();
  });

  continueBtn.addEventListener('click', () => {
    if (continueGame()) {
      showTravelScreen();
    } else {
      alert('No saved game');
    }
  });
}

function showInitError(e) {
  console.error(e);
  const banner = document.createElement('div');
  banner.textContent = 'Failed to initialize: ' + e.message;
  banner.style.position = 'fixed';
  banner.style.top = '0';
  banner.style.left = '0';
  banner.style.right = '0';
  banner.style.background = 'red';
  banner.style.color = 'white';
  banner.style.padding = '0.5em';
  document.body.appendChild(banner);
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch(showInitError);
});
