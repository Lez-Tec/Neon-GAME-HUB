/**
 * LocalStorage Manager for High Scores, Achievements, and Stats.
 */

class ArcadeStorage {
  constructor() {
    this.STORAGE_KEY = 'NEON_ARCADE_DATA_V1';
    this.data = this.loadData();
  }

  loadData() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage unavailable or corrupt. Resetting defaults.', e);
    }
    return this.getDefaults();
  }

  getDefaults() {
    return {
      highScores: {
        snake: 0,
        brickbreaker: 0,
        pong: 0,
        memory: 0,
        flappy: 0,
        '2048': 0
      },
      gamesPlayed: {
        snake: 0,
        brickbreaker: 0,
        pong: 0,
        memory: 0,
        flappy: 0,
        '2048': 0
      },
      totalPlays: 0,
      soundMuted: false
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save to LocalStorage', e);
    }
  }

  getHighScore(gameId) {
    return this.data.highScores[gameId] || 0;
  }

  setHighScore(gameId, score) {
    const current = this.getHighScore(gameId);
    if (score > current) {
      this.data.highScores[gameId] = score;
      this.save();
      return true; // New High Score record!
    }
    return false;
  }

  recordGamePlay(gameId) {
    if (!this.data.gamesPlayed[gameId]) {
      this.data.gamesPlayed[gameId] = 0;
    }
    this.data.gamesPlayed[gameId]++;
    this.data.totalPlays++;
    this.save();
  }

  getTotalPlays() {
    return this.data.totalPlays || 0;
  }

  getGamePlays(gameId) {
    return this.data.gamesPlayed[gameId] || 0;
  }

  setMutedPref(isMuted) {
    this.data.soundMuted = isMuted;
    this.save();
  }

  getMutedPref() {
    return !!this.data.soundMuted;
  }

  resetAll() {
    this.data = this.getDefaults();
    this.save();
  }
}

window.arcadeStorage = new ArcadeStorage();
