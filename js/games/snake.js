/**
 * Neon Snake Game Module
 */

class NeonSnakeGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    
    this.gridSize = 20;
    this.tileCount = 30; // 600px canvas size / 20 = 30 tiles
    this.canvas.width = 600;
    this.canvas.height = 600;

    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = { x: 15, y: 15, type: 'normal' };
    this.particles = [];
    this.score = 0;
    this.speed = 90; // ms per tick
    this.isRunning = false;
    this.gameLoopTimer = null;
    
    this.bindControls();
  }

  bindControls() {
    this.keydownHandler = (e) => {
      if (!this.isRunning) return;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
          break;
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.loop();
  }

  reset() {
    this.snake = [
      { x: 10, y: 15 },
      { x: 9, y: 15 },
      { x: 8, y: 15 }
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.speed = 90;
    this.particles = [];
    this.spawnFood();
    this.onScoreUpdate(this.score);
  }

  spawnFood() {
    let valid = false;
    while (!valid) {
      this.food.x = Math.floor(Math.random() * this.tileCount);
      this.food.y = Math.floor(Math.random() * this.tileCount);
      valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
    }
    // 20% chance of golden super food
    this.food.type = Math.random() < 0.2 ? 'golden' : 'normal';
  }

  spawnParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x * this.gridSize + this.gridSize / 2,
        y: y * this.gridSize + this.gridSize / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: Math.random() * 4 + 2,
        color: color,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.02
      });
    }
  }

  stop() {
    this.isRunning = false;
    if (this.gameLoopTimer) {
      clearTimeout(this.gameLoopTimer);
    }
    window.removeEventListener('keydown', this.keydownHandler);
  }

  loop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();

    this.gameLoopTimer = setTimeout(() => this.loop(), this.speed);
  }

  update() {
    this.dir = { ...this.nextDir };
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    // Wall collision check
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.triggerGameOver();
      return;
    }

    // Self collision check
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.triggerGameOver();
      return;
    }

    this.snake.unshift(head);

    // Food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      const isGolden = this.food.type === 'golden';
      const pts = isGolden ? 30 : 10;
      this.score += pts;
      this.onScoreUpdate(this.score);

      const particleColor = isGolden ? '#ffe600' : '#00f0ff';
      this.spawnParticles(this.food.x, this.food.y, particleColor);
      window.arcadeAudio.playEat();

      // Slightly increase speed
      if (this.speed > 50) this.speed -= 1;

      this.spawnFood();
    } else {
      this.snake.pop();
    }

    // Update particle physics
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  triggerGameOver() {
    this.isRunning = false;
    window.arcadeAudio.playGameOver();
    this.onGameOver(this.score);
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#05070c';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Subtle Grid Lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.tileCount; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.gridSize, 0);
      this.ctx.lineTo(i * this.gridSize, this.canvas.height);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.gridSize);
      this.ctx.lineTo(this.canvas.width, i * this.gridSize);
      this.ctx.stroke();
    }

    // Draw Food
    const foodX = this.food.x * this.gridSize + this.gridSize / 2;
    const foodY = this.food.y * this.gridSize + this.gridSize / 2;
    const isGolden = this.food.type === 'golden';
    
    this.ctx.save();
    this.ctx.shadowColor = isGolden ? '#ffe600' : '#00f0ff';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = isGolden ? '#ffe600' : '#00f0ff';
    this.ctx.beginPath();
    this.ctx.arc(foodX, foodY, this.gridSize / 2 - 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Draw Snake
    this.snake.forEach((segment, index) => {
      const x = segment.x * this.gridSize;
      const y = segment.y * this.gridSize;
      
      this.ctx.save();
      if (index === 0) {
        // Head
        this.ctx.shadowColor = '#00ff66';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00ff66';
        this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
      } else {
        // Body with gradient glow
        const alpha = Math.max(0.3, 1 - index / this.snake.length);
        this.ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
      }
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
  }
}
