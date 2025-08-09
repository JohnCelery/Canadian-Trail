import { startNewGame, continueGame } from './state/GameState.js';
import { showTravelScreen } from './ui/TravelScreen.js';
import { loadAssets, getImage, getMeta } from './systems/assets.js';

async function init() {
  await loadAssets('data/manifest.json');

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

document.addEventListener('DOMContentLoaded', init);
