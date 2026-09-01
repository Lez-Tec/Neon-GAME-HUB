/**
 * Neon Arcade Main Application Controller
 */

class NeonArcadeApp {
  constructor() {
    this.currentView = 'hub'; // 'hub' | 'play'
    this.activeGameId = null;
    this.activeGameInstance = null;
    this.currentScore = 0;

    this.initBgCanvas();
    this.initUI();
    this.renderStats();
  }

  initBgCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: Math.random() < 0.5 ? 'rgba(0, 240, 255, 0.25)' : 'rgba(112, 0, 255, 0.2)'
      });
    }

    function animateBg() {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animateBg);
    }

    animateBg();
  }

  initUI() {
    // Nav Sound Mute Button
    const muteBtn = document.getElementById('sound-toggle-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = window.arcadeAudio.toggleMute();
        window.arcadeStorage.setMutedPref(isMuted);
        muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Sound ON';
      });
      // Restore pref
      if (window.arcadeStorage.getMutedPref()) {
        window.arcadeAudio.toggleMute();
        muteBtn.textContent = '🔇 Muted';
      }
    }

    // Stats Modal Trigger
    const statsBtn = document.getElementById('stats-modal-btn');
    const statsModal = document.getElementById('stats-modal');
    const closeStatsBtn = document.getElementById('close-stats-btn');

    if (statsBtn && statsModal) {
      statsBtn.addEventListener('click', () => {
        this.renderStats();
        statsModal.classList.add('active');
      });
    }
    if (closeStatsBtn && statsModal) {
      closeStatsBtn.addEventListener('click', () => {
        statsModal.classList.remove('active');
      });
    }

    // Reset Stats
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all high scores and arcade stats?')) {
          window.arcadeStorage.resetAll();
          this.renderStats();
          this.renderHubHighScores();
        }
      });
    }

    // Back to Hub Button
    const backBtn = document.getElementById('back-to-hub');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.switchView('hub'));
    }

    // Game Cards Click Listeners
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.dataset.game;
        if (gameId) this.launchGame(gameId);
      });
    });

    // Action buttons on game overlay (Restart / Pause)
    const restartBtn = document.getElementById('overlay-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.hideOverlay();
        if (this.activeGameInstance) this.activeGameInstance.start();
      });
    }

    const hubFromOverlayBtn = document.getElementById('overlay-hub-btn');
    if (hubFromOverlayBtn) {
      hubFromOverlayBtn.addEventListener('click', () => {
        this.hideOverlay();
        this.switchView('hub');
      });
    }

    this.renderHubHighScores();
  }

  renderHubHighScores() {
    const games = ['snake', 'brickbreaker', 'pong', 'memory', 'flappy', '2048'];
    games.forEach(g => {
      const el = document.getElementById(`score-${g}`);
      if (el) {
        el.textContent = window.arcadeStorage.getHighScore(g);
      }
    });

    // Total plays pill
    const totalPlaysEl = document.getElementById('total-plays-count');
    if (totalPlaysEl) {
      totalPlaysEl.textContent = window.arcadeStorage.getTotalPlays();
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

    if (viewName === 'hub') {
      if (this.activeGameInstance) {
        this.activeGameInstance.stop();
        this.activeGameInstance = null;
      }
      document.getElementById('hub-view').classList.add('active');
      this.renderHubHighScores();
    } else if (viewName === 'play') {
      document.getElementById('play-view').classList.add('active');
    }
  }

  launchGame(gameId) {
    this.activeGameId = gameId;
    this.switchView('play');

    window.arcadeStorage.recordGamePlay(gameId);

    const canvas = document.getElementById('game-canvas');
    const domContainer = document.getElementById('dom-game-stage');
    const titleEl = document.getElementById('game-title-text');
    const currentScoreEl = document.getElementById('current-score');
    const highScoreEl = document.getElementById('stage-high-score');
    const controlsHint = document.getElementById('controls-hint-text');

    highScoreEl.textContent = window.arcadeStorage.getHighScore(gameId);
    currentScoreEl.textContent = 0;
    this.hideOverlay();

    // Toggle Canvas vs DOM container
    if (['memory', '2048'].includes(gameId)) {
      canvas.style.display = 'none';
      domContainer.style.display = 'flex';
    } else {
      canvas.style.display = 'block';
      domContainer.style.display = 'none';
    }

    const onScore = (score) => {
      this.currentScore = score;
      currentScoreEl.textContent = score;
    };

    const onGameOver = (finalScore) => {
      const isNewRecord = window.arcadeStorage.setHighScore(gameId, finalScore);
      highScoreEl.textContent = window.arcadeStorage.getHighScore(gameId);
      this.showGameOverOverlay(finalScore, isNewRecord);
    };

    // Instantiate specific game module
    if (gameId === 'snake') {
      titleEl.textContent = 'NEON SNAKE CORE';
      controlsHint.innerHTML = 'Use <span class="key-badge">WASD</span> or <span class="key-badge">ARROWS</span> to move. Eat glowing particles to grow!';
      this.activeGameInstance = new NeonSnakeGame(canvas, onScore, onGameOver);
    } else if (gameId === 'brickbreaker') {
      titleEl.textContent = 'CYBER BRICK BREAKER';
      controlsHint.innerHTML = 'Move mouse or <span class="key-badge">A</span>/<span class="key-badge">D</span> to slide paddle. Catch powerups!';
      this.activeGameInstance = new CyberBrickBreakerGame(canvas, onScore, onGameOver);
    } else if (gameId === 'pong') {
      titleEl.textContent = 'GALACTIC PONG';
      controlsHint.innerHTML = 'Use <span class="key-badge">W</span>/<span class="key-badge">S</span> for Player 1. Score 7 points to win!';
      this.activeGameInstance = new GalacticPongGame(canvas, onScore, onGameOver);
    } else if (gameId === 'memory') {
      titleEl.textContent = 'MEMORY MATRIX';
      controlsHint.innerHTML = 'Click cards to flip and match pairs. Build combos for bonus multipliers!';
      this.activeGameInstance = new MemoryMatrixGame(domContainer, onScore, onGameOver);
    } else if (gameId === 'flappy') {
      titleEl.textContent = 'COSMIC FLAPPY';
      controlsHint.innerHTML = 'Press <span class="key-badge">SPACE</span> or Click to thrust upwards through warp portals!';
      this.activeGameInstance = new CosmicFlappyGame(canvas, onScore, onGameOver);
    } else if (gameId === '2048') {
      titleEl.textContent = '2048 FUSION';
      controlsHint.innerHTML = 'Use <span class="key-badge">WASD</span> or <span class="key-badge">ARROWS</span> to slide and merge tiles!';
      this.activeGameInstance = new Game2048(domContainer, onScore, onGameOver);
    }

    if (this.activeGameInstance) {
      this.activeGameInstance.start();
    }
  }

  showGameOverOverlay(score, isNewRecord) {
    const overlay = document.getElementById('game-overlay');
    const title = document.getElementById('overlay-title-text');
    const sub = document.getElementById('overlay-subtitle-text');
    const scoreVal = document.getElementById('overlay-score-val');

    title.textContent = isNewRecord ? '🏆 NEW RECORD!' : 'GAME OVER';
    sub.textContent = isNewRecord ? 'Outstanding performance! You set a new high score.' : 'Better luck next time! Keep practicing.';
    scoreVal.textContent = score;

    overlay.classList.remove('hidden');
  }

  hideOverlay() {
    const overlay = document.getElementById('game-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  renderStats() {
    const body = document.getElementById('stats-table-body');
    if (!body) return;

    const games = [
      { id: 'snake', name: 'Neon Snake Core' },
      { id: 'brickbreaker', name: 'Cyber Brick Breaker' },
      { id: 'pong', name: 'Galactic Pong' },
      { id: 'memory', name: 'Memory Matrix' },
      { id: 'flappy', name: 'Cosmic Flappy' },
      { id: '2048', name: '2048 Fusion' }
    ];

    body.innerHTML = '';
    games.forEach(g => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${g.name}</strong></td>
        <td class="stat-val">${window.arcadeStorage.getGamePlays(g.id)}</td>
        <td class="stat-val">${window.arcadeStorage.getHighScore(g.id)}</td>
      `;
      body.appendChild(tr);
    });
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.arcadeApp = new NeonArcadeApp();
});
