import { startNewGame, continueGame } from './state/GameState.js';
import { showTravelScreen } from './ui/TravelScreen.js';

function init() {
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
