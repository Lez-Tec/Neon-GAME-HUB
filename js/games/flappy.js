/**
 * Cosmic Flappy Game Module
 */

class CosmicFlappyGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 600;

    this.bird = {
      x: 100,
      y: 280,
      radius: 16,
      vy: 0,
      gravity: 0.4,
      jump: -7.5
    };

    this.pipes = [];
    this.stars = [];
    this.particles = [];
    
    this.score = 0;
    this.frame = 0;
    this.pipeGap = 160;
    this.pipeSpeed = 3;

    this.isRunning = false;
    this.animId = null;

    this.bindControls();
  }

  bindControls() {
    this.flapHandler = (e) => {
      if (!this.isRunning) return;
      if (e.type === 'keydown' && e.code !== 'Space' && e.key !== 'ArrowUp' && e.key !== 'w' && e.key !== 'W') return;
      e.preventDefault();

      this.bird.vy = this.bird.jump;
      this.spawnTrail();
      window.arcadeAudio.playJump();
    };

    window.addEventListener('keydown', this.flapHandler);
    this.canvas.addEventListener('mousedown', this.flapHandler);
    this.canvas.addEventListener('touchstart', this.flapHandler);
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.loop();
  }

  reset() {
    this.bird.y = 280;
    this.bird.vy = 0;
    this.pipes = [];
    this.stars = [];
    this.particles = [];
    this.score = 0;
    this.frame = 0;
    this.onScoreUpdate(this.score);
  }

  spawnTrail() {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.bird.x - 10,
        y: this.bird.y + (Math.random() - 0.5) * 10,
        vx: -Math.random() * 4 - 2,
        vy: (Math.random() - 0.5) * 3,
        radius: Math.random() * 4 + 2,
        color: '#00f0ff',
        life: 1.0,
        decay: 0.05
      });
    }
  }

  spawnPipe() {
    const minTop = 60;
    const maxTop = this.canvas.height - this.pipeGap - 100;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

    this.pipes.push({
      x: this.canvas.width,
      top: topHeight,
      bottom: this.canvas.height - topHeight - this.pipeGap,
      w: 65,
      passed: false
    });

    // 40% chance of spawning collectible star inside gap
    if (Math.random() < 0.4) {
      this.stars.push({
        x: this.canvas.width + 30,
        y: topHeight + this.pipeGap / 2,
        radius: 10,
        collected: false
      });
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.flapHandler);
    this.canvas.removeEventListener('mousedown', this.flapHandler);
    this.canvas.removeEventListener('touchstart', this.flapHandler);
  }

  loop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();

    this.animId = requestAnimationFrame(() => this.loop());
  }

  update() {
    this.frame++;

    // Bird Gravity
    this.bird.vy += this.bird.gravity;
    this.bird.y += this.bird.vy;

    // Floor & Ceiling Collision
    if (this.bird.y - this.bird.radius < 0 || this.bird.y + this.bird.radius > this.canvas.height) {
      this.triggerGameOver();
      return;
    }

    // Spawn Pipes
    if (this.frame % 110 === 0) {
      this.spawnPipe();
    }

    // Move Pipes & Check Collisions
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= this.pipeSpeed;

      // Pipe Collision
      if (
        this.bird.x + this.bird.radius > p.x &&
        this.bird.x - this.bird.radius < p.x + p.w
      ) {
        if (
          this.bird.y - this.bird.radius < p.top ||
          this.bird.y + this.bird.radius > this.canvas.height - p.bottom
        ) {
          this.triggerGameOver();
          return;
        }
      }

      // Pass Pipe Score
      if (!p.passed && p.x + p.w < this.bird.x) {
        p.passed = true;
        this.score += 10;
        this.onScoreUpdate(this.score);
        window.arcadeAudio.playPoint();
      }

      if (p.x + p.w < 0) this.pipes.splice(i, 1);
    }

    // Move Stars & Collect
    for (let sIndex = this.stars.length - 1; sIndex >= 0; sIndex--) {
      const s = this.stars[sIndex];
      s.x -= this.pipeSpeed;

      const dist = Math.hypot(this.bird.x - s.x, this.bird.y - s.y);
      if (dist < this.bird.radius + s.radius && !s.collected) {
        s.collected = true;
        this.score += 25; // Bonus star score
        this.onScoreUpdate(this.score);
        window.arcadeAudio.playEat();
        this.stars.splice(sIndex, 1);
      } else if (s.x < -20) {
        this.stars.splice(sIndex, 1);
      }
    }

    // Particles Update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.life -= part.decay;
      if (part.life <= 0) this.particles.splice(i, 1);
    }
  }

  triggerGameOver() {
    this.isRunning = false;
    window.arcadeAudio.playGameOver();
    this.onGameOver(this.score);
  }

  draw() {
    this.ctx.fillStyle = '#05070c';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Pipes (Cosmic Neon Portals)
    this.pipes.forEach(p => {
      this.ctx.save();
      this.ctx.shadowColor = '#ff0055';
      this.ctx.shadowBlur = 12;
      this.ctx.fillStyle = 'rgba(255, 0, 85, 0.85)';
      this.ctx.strokeStyle = '#ff0055';
      this.ctx.lineWidth = 2;

      // Top Pipe
      this.ctx.fillRect(p.x, 0, p.w, p.top);
      this.ctx.strokeRect(p.x, 0, p.w, p.top);

      // Bottom Pipe
      this.ctx.fillRect(p.x, this.canvas.height - p.bottom, p.w, p.bottom);
      this.ctx.strokeRect(p.x, this.canvas.height - p.bottom, p.w, p.bottom);
      this.ctx.restore();
    });

    // Draw Stars
    this.stars.forEach(s => {
      this.ctx.save();
      this.ctx.shadowColor = '#ffe600';
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = '#ffe600';
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Particles
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Bird Ship
    this.ctx.save();
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 18;
    this.ctx.fillStyle = '#00f0ff';
    
    // Tilt angle based on velocity
    const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.bird.vy * 0.08));
    this.ctx.translate(this.bird.x, this.bird.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Eye / Cockpit
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(6, -4, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }
}
