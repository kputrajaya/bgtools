(() => {
  const GAMES = [
    { name: 'Herd Mentality', file: 'herd_mentality.txt' },
    { name: 'Ito', file: 'ito.txt' },
    { name: 'Just One', file: 'just_one.txt' },
  ];

  function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function init() {
    const state = new Map();

    async function loadGame(game) {
      if (state.has(game.name)) return state.get(game.name);

      const response = await fetch(`data/${game.file}`);
      if (!response.ok) throw new Error(`Could not load ${game.file}: ${response.status}`);

      const prompts = (await response.text())
        .split(/\r?\n/)
        .map((prompt) => prompt.trim())
        .filter(Boolean);
      if (!prompts.length) throw new Error(`No prompts found in ${game.file}`);

      const deck = { prompts: shuffle(prompts), index: 0 };
      state.set(game.name, deck);
      return deck;
    }

    function getNextPrompt(game) {
      const deck = state.get(game.name);
      const prompt = deck.prompts[deck.index];
      deck.index += 1;
      if (deck.index >= deck.prompts.length) deck.index = 0;
      return prompt;
    }

    const container = document.getElementById('gameBtns');
    const modal = new bootstrap.Modal(document.getElementById('promptModal'));
    const promptText = document.getElementById('promptText');
    const promptNextBtn = document.getElementById('promptNextBtn');
    let currentGame = null;

    for (const game of GAMES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-primary btn-lg p-3 fs-4';
      btn.textContent = game.name;
      btn.addEventListener('click', async () => {
        currentGame = game;
        btn.disabled = true;
        try {
          await loadGame(game);
          if (currentGame !== game) return;
          promptText.textContent = getNextPrompt(game);
          modal.show();
        } catch (error) {
          console.error('Failed to load prompts:', error);
          if (currentGame === game) alert(`Failed to load prompts for ${game.name}.`);
        } finally {
          btn.disabled = false;
        }
      });
      container.appendChild(btn);
    }

    promptNextBtn.addEventListener('click', () => {
      if (currentGame) promptText.textContent = getNextPrompt(currentGame);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
