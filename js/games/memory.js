/**
 * Memory Matrix DOM Card Game Module
 */

class MemoryMatrixGame {
  constructor(containerEl, onScoreUpdate, onGameOver) {
    this.container = containerEl;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.symbols = ['🚀', '⚡', '🎮', '👾', '💎', '🔥', '🔮', '🌟'];
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.score = 0;
    this.streak = 0;
    this.startTime = null;
    this.timerId = null;
    this.isLockBoard = false;
    this.isRunning = false;
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.render();
    this.startTime = Date.now();
  }

  reset() {
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.score = 0;
    this.streak = 0;
    this.isLockBoard = false;

    // Create 8 duplicated pairs and shuffle
    const deck = [...this.symbols, ...this.symbols];
    deck.sort(() => Math.random() - 0.5);

    this.cards = deck.map((symbol, index) => ({
      id: index,
      symbol: symbol,
      isFlipped: false,
      isMatched: false
    }));

    this.onScoreUpdate(0);
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) clearInterval(this.timerId);
  }

  render() {
    this.container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'memory-grid';

    this.cards.forEach((card, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = `memory-card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`;
      cardEl.dataset.index = idx;

      cardEl.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-front">❓</div>
          <div class="memory-card-back">${card.symbol}</div>
        </div>
      `;

      cardEl.addEventListener('click', () => this.handleCardClick(idx, cardEl));
      grid.appendChild(cardEl);
    });

    this.container.appendChild(grid);
  }

  handleCardClick(index, cardEl) {
    if (!this.isRunning || this.isLockBoard) return;
    const card = this.cards[index];
    if (card.isFlipped || card.isMatched) return;

    // Flip Card
    card.isFlipped = true;
    cardEl.classList.add('flipped');
    this.flippedCards.push({ card, el: cardEl });
    window.arcadeAudio.playFlip();

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.checkMatch();
    }
  }

  checkMatch() {
    this.isLockBoard = true;
    const [c1, c2] = this.flippedCards;

    if (c1.card.symbol === c2.card.symbol) {
      // Match found!
      c1.card.isMatched = true;
      c2.card.isMatched = true;
      c1.el.classList.add('matched');
      c2.el.classList.add('matched');

      this.matchedPairs++;
      this.streak++;
      const pts = 100 + (this.streak * 50);
      this.score += pts;
      this.onScoreUpdate(this.score);

      window.arcadeAudio.playMatch();
      this.flippedCards = [];
      this.isLockBoard = false;

      // Check Victory Condition
      if (this.matchedPairs === this.symbols.length) {
        this.triggerVictory();
      }
    } else {
      // No Match
      this.streak = 0;
      window.arcadeAudio.playHit();
      setTimeout(() => {
        c1.card.isFlipped = false;
        c2.card.isFlipped = false;
        c1.el.classList.remove('flipped');
        c2.el.classList.remove('flipped');
        this.flippedCards = [];
        this.isLockBoard = false;
      }, 900);
    }
  }

  triggerVictory() {
    this.isRunning = false;
    const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
    // Time bonus
    const timeBonus = Math.max(0, 500 - timeTaken * 10);
    this.score += timeBonus;
    this.onScoreUpdate(this.score);

    window.arcadeAudio.playWin();
    this.onGameOver(this.score);
  }
}
