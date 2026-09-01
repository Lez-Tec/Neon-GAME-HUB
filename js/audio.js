/**
 * Web Audio API Sound Synthesizer Engine
 * Generates retro arcade sound effects on-the-fly without external audio assets.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.3;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, type, duration, endFreq = null, volScale = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      if (endFreq !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 10), this.ctx.currentTime + duration);
      }

      const masterVol = this.volume * volScale;
      gain.gain.setValueAtTime(masterVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }

  // --- Specific Arcade Sound FX ---

  playEat() {
    // Upward pitch chirp (Snake food, star pickup)
    this.playTone(400, 'square', 0.08, 800, 0.6);
  }

  playJump() {
    // Flappy jump / Bounce sound
    this.playTone(180, 'square', 0.12, 450, 0.7);
  }

  playBounce() {
    // Pong / Brick paddle bounce
    this.playTone(300, 'triangle', 0.06, 150, 0.8);
  }

  playHit() {
    // Brick break hit
    this.playTone(150, 'sawtooth', 0.08, 60, 0.9);
  }

  playFlip() {
    // Card flip sound
    this.playTone(500, 'sine', 0.05, 300, 0.4);
  }

  playMatch() {
    // Memory pair match chime
    this.playTone(523.25, 'triangle', 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.15), 80); // E5
  }

  playSlide() {
    // 2048 tile slide
    this.playTone(220, 'sine', 0.06, 330, 0.3);
  }

  playMerge() {
    // 2048 tile merge
    this.playTone(440, 'triangle', 0.1, 880, 0.7);
  }

  playPoint() {
    // General point scored
    this.playTone(600, 'sine', 0.1, 1200, 0.5);
  }

  playGameOver() {
    // Descending game over sound
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.playTone(300, 'sawtooth', 0.2, 150, 0.8);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.3, 80, 0.8), 150);
  }

  playWin() {
    // Fanfare for high score / victory
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.15, null, 0.8), idx * 100);
    });
  }
}

// Global Sound Engine Instance
window.arcadeAudio = new SoundEngine();
