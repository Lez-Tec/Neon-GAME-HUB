/**
 * Cyber Brick Breaker Game Module
 */

class CyberBrickBreakerGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    
    this.canvas.width = 700;
    this.canvas.height = 550;

    this.paddle = {
      width: 120,
      height: 14,
      x: 290,
      y: 510,
      speed: 8,
      dx: 0
    };

    this.balls = [];
    this.bricks = [];
    this.particles = [];
    this.powerups = [];
    
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.isRunning = false;
    this.animId = null;

    this.bindControls();
  }

  bindControls() {
    this.keydownHandler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.paddle.dx = -this.paddle.speed;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.paddle.dx = this.paddle.speed;
    };

    this.keyupHandler = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) this.paddle.dx = 0;
    };

    this.mousemoveHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, mouseX - this.paddle.width / 2));
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.canvas.addEventListener('mousemove', this.mousemoveHandler);
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.loop();
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.paddle.width = 120;
    this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
    this.particles = [];
    this.powerups = [];
    this.resetBall();
    this.initBricks();
    this.onScoreUpdate(this.score);
  }

  resetBall() {
    this.balls = [{
      x: this.canvas.width / 2,
      y: this.paddle.y - 12,
      radius: 8,
      dx: (Math.random() < 0.5 ? 1 : -1) * (4 + this.level * 0.5),
      dy: -5 - this.level * 0.5
    }];
  }

  initBricks() {
    this.bricks = [];
    const rows = 5 + Math.min(this.level, 3);
    const cols = 8;
    const padding = 10;
    const offsetTop = 50;
    const offsetLeft = 45;
    const brickWidth = (this.canvas.width - offsetLeft * 2 - (cols - 1) * padding) / cols;
    const brickHeight = 22;

    const colors = ['#ff0055', '#7000ff', '#00f0ff', '#00ff66', '#ffe600'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = colors[r % colors.length];
        this.bricks.push({
          x: offsetLeft + c * (brickWidth + padding),
          y: offsetTop + r * (brickHeight + padding),
          w: brickWidth,
          h: brickHeight,
          color: color,
          hp: r === 0 ? 2 : 1, // Top row has 2 HP
          maxHp: r === 0 ? 2 : 1
        });
      }
    }
  }

  spawnParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        radius: Math.random() * 3 + 2,
        color: color,
        life: 1.0,
        decay: 0.03
      });
    }
  }

  spawnPowerup(x, y) {
    if (Math.random() < 0.25) { // 25% drop rate
      const types = ['wide', 'multiball', 'life'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.powerups.push({ x, y, type, radius: 10, vy: 2.5 });
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.canvas.removeEventListener('mousemove', this.mousemoveHandler);
  }

  loop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();

    this.animId = requestAnimationFrame(() => this.loop());
  }

  update() {
    // Move paddle
    this.paddle.x += this.paddle.dx;
    this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x));

    // Update Balls
    for (let bIndex = this.balls.length - 1; bIndex >= 0; bIndex--) {
      const ball = this.balls[bIndex];
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Wall Bounce Left/Right
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.dx *= -1;
        window.arcadeAudio.playBounce();
      } else if (ball.x + ball.radius > this.canvas.width) {
        ball.x = this.canvas.width - ball.radius;
        ball.dx *= -1;
        window.arcadeAudio.playBounce();
      }

      // Wall Bounce Top
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy *= -1;
        window.arcadeAudio.playBounce();
      }

      // Paddle Collision
      if (
        ball.y + ball.radius >= this.paddle.y &&
        ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
        ball.x >= this.paddle.x &&
        ball.x <= this.paddle.x + this.paddle.width
      ) {
        // Hit location relative to paddle center determines reflection angle
        const hitPos = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = hitPos * (speed * 0.85);
        ball.dy = -Math.abs(Math.sqrt(Math.max(16, speed * speed - ball.dx * ball.dx)));
        window.arcadeAudio.playBounce();
      }

      // Brick Collision
      for (let i = this.bricks.length - 1; i >= 0; i--) {
        const brick = this.bricks[i];
        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.w &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.h
        ) {
          ball.dy *= -1;
          brick.hp--;
          this.spawnParticles(ball.x, ball.y, brick.color);
          window.arcadeAudio.playHit();

          if (brick.hp <= 0) {
            this.score += 15 * this.level;
            this.onScoreUpdate(this.score);
            this.spawnPowerup(brick.x + brick.w / 2, brick.y + brick.h / 2);
            this.bricks.splice(i, 1);
          }

          break;
        }
      }

      // Ball Out of Bottom
      if (ball.y - ball.radius > this.canvas.height) {
        this.balls.splice(bIndex, 1);
      }
    }

    // Check if all balls lost
    if (this.balls.length === 0) {
      this.lives--;
      if (this.lives <= 0) {
        this.isRunning = false;
        window.arcadeAudio.playGameOver();
        this.onGameOver(this.score);
        return;
      } else {
        this.resetBall();
      }
    }

    // Check level clear
    if (this.bricks.length === 0) {
      this.level++;
      window.arcadeAudio.playWin();
      this.initBricks();
      this.resetBall();
    }

    // Powerups Update
    for (let pIndex = this.powerups.length - 1; pIndex >= 0; pIndex--) {
      const p = this.powerups[pIndex];
      p.y += p.vy;

      // Paddle Catch
      if (
        p.y + p.radius >= this.paddle.y &&
        p.x >= this.paddle.x &&
        p.x <= this.paddle.x + this.paddle.width
      ) {
        window.arcadeAudio.playEat();
        if (p.type === 'wide') {
          this.paddle.width = Math.min(220, this.paddle.width + 40);
        } else if (p.type === 'multiball' && this.balls.length > 0) {
          const b = this.balls[0];
          this.balls.push({ x: b.x, y: b.y, radius: b.radius, dx: -b.dx, dy: b.dy });
        } else if (p.type === 'life') {
          this.lives++;
        }
        this.powerups.splice(pIndex, 1);
      } else if (p.y > this.canvas.height) {
        this.powerups.splice(pIndex, 1);
      }
    }

    // Particles Update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw() {
    this.ctx.fillStyle = '#05070c';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Bricks
    this.bricks.forEach(b => {
      this.ctx.save();
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = b.hp > 1 ? 12 : 5;
      this.ctx.fillRect(b.x, b.y, b.w, b.h);

      if (b.hp > 1) {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(b.x, b.y, b.w, b.h);
      }
      this.ctx.restore();
    });

    // Draw Paddle
    this.ctx.save();
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    this.ctx.restore();

    // Draw Balls
    this.balls.forEach(ball => {
      this.ctx.save();
      this.ctx.shadowColor = '#ffe600';
      this.ctx.shadowBlur = 12;
      this.ctx.fillStyle = '#ffe600';
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Powerups
    this.powerups.forEach(p => {
      this.ctx.save();
      this.ctx.fillStyle = p.type === 'wide' ? '#00ff66' : p.type === 'multiball' ? '#ff0055' : '#ffe600';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
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

    // Lives & Level Overlay Indicator
    this.ctx.font = '14px Outfit';
    this.ctx.fillStyle = '#8a99ad';
    this.ctx.fillText(`LIVES: ${'❤️'.repeat(this.lives)}  |  LEVEL: ${this.level}`, 15, 25);
  }
}
