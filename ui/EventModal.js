import { chooseEventChoice } from '../state/GameState.js';

export function showEventModal(event, stage, onClose) {
  const overlay = document.createElement('div');
  overlay.id = 'event-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.tabIndex = -1;

  const box = document.createElement('div');
  box.className = 'modal-box';

  const text = document.createElement('p');
  text.textContent = stage.text || '';
  box.appendChild(text);

  const btnWrap = document.createElement('div');
  const buttons = [];
  if (stage.choices) {
    stage.choices.forEach((ch, idx) => {
      const btn = document.createElement('button');
      btn.textContent = `${idx + 1}. ${ch.text}`;
      btn.dataset.choice = ch.id;
      btn.addEventListener('click', () => {
        chooseEventChoice(ch.id);
        close();
      });
      btnWrap.appendChild(btn);
      buttons.push(btn);
    });
  } else if (stage.followupRoll) {
    const btn = document.createElement('button');
    btn.textContent = 'Continue';
    btn.addEventListener('click', () => {
      chooseEventChoice(null);
      close();
    });
    btnWrap.appendChild(btn);
    buttons.push(btn);
  }
  box.appendChild(btnWrap);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function close() {
    document.body.removeChild(overlay);
    onClose && onClose();
  }

  overlay.addEventListener('keydown', (e) => {
    if (stage.choices) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < buttons.length) {
        buttons[idx].click();
      }
    } else if (stage.followupRoll && e.key === 'Enter') {
      buttons[0].click();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      buttons[0].focus();
    }
  });

  buttons[0] && buttons[0].focus();
}

