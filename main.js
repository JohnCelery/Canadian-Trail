function init() {
  const newGameBtn = document.getElementById('new-game');
  const continueBtn = document.getElementById('continue');

  newGameBtn.addEventListener('click', () => {
    console.log('New Game selected');
  });

  continueBtn.addEventListener('click', () => {
    console.log('Continue selected');
  });
}

document.addEventListener('DOMContentLoaded', init);
