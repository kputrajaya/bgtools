const MAX_CATEGORIES = 20;
const MAX_PLAYERS = 10;

document.addEventListener('alpine:init', () => {
  Alpine.data('score', () => ({
    gameData: { '': ['Category 1', 'Category 2'] },
    selectedGame: '',
    categories: ['Category 1', 'Category 2'],
    players: [
      { name: 'P1', scores: [0, 0] },
      { name: 'P2', scores: [0, 0] },
    ],

    addCategory() {
      if (this.categories.length >= MAX_CATEGORIES) return;
      this.categories.push(`Category ${this.categories.length + 1}`);
      this.players.forEach((p) => {
        p.scores.push(0);
      });
    },
    addPlayer() {
      if (this.players.length >= MAX_PLAYERS) return;
      this.players.push({
        name: `P${this.players.length + 1}`,
        scores: Array(this.categories.length).fill(0),
      });
    },
    loadPreset() {
      this.categories = JSON.parse(JSON.stringify(this.gameData[this.selectedGame]));
      this.players.forEach((p) => {
        p.scores = Array(this.categories.length).fill(0);
      });
    },
    cleanScores(player) {
      player.scores = player.scores.map((s) => parseInt(s) || 0);
    },
    countTotal(player) {
      return player.scores.reduce((sum, s) => sum + (parseInt(s) || 0), 0);
    },
    select() {
      this.$el.select();
    },

    // Initialization
    async init() {
      try {
        const response = await fetch(
          'https://gist.githubusercontent.com/kputrajaya/1e0d9e787c7716a05199659fb42d3ba5/raw/bgtools-score.json'
        );
        const gameData = await response.json();
        Object.assign(this.gameData, gameData);
      } catch (error) {
        alert('Failed to load game presets!');
      }
    },
  }));
});
