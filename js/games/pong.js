/**
 * Galactic Pong Game Module
 */

class GalacticPongGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.canvas.width = 750;
    this.canvas.height = 500;

    this.paddleHeight = 90;
    this.paddleWidth = 14;

    this.p1 = { x: 20, y: 205, score: 0, dy: 0, speed: 7 };
    this.p2 = { x: 716, y: 205, score: 0, dy: 0, speed: 5.5 };

    this.ball = { x: 375, y: 250, radius: 8, dx: 5, dy: 3 };

    this.isTwoPlayer = false;
    this.aiDifficulty = 0.85; // AI tracking accuracy
    this.winningScore = 7;

    this.isRunning = false;
    this.animId = null;

    this.bindControls();
  }

  bindControls() {
    this.keydownHandler = (e) => {
      if (['w', 'W'].includes(e.key)) this.p1.dy = -this.p1.speed;
      if (['s', 'S'].includes(e.key)) this.p1.dy = this.p1.speed;

      if (this.isTwoPlayer) {
        if (e.key === 'ArrowUp') this.p2.dy = -this.p2.speed;
        if (e.key === 'ArrowDown') this.p2.dy = this.p2.speed;
      }
    };

    this.keyupHandler = (e) => {
      if (['w', 'W', 's', 'S'].includes(e.key)) this.p1.dy = 0;
      if (this.isTwoPlayer && ['ArrowUp', 'ArrowDown'].includes(e.key)) this.p2.dy = 0;
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.loop();
  }

  reset() {
    this.p1.score = 0;
    this.p2.score = 0;
    this.p1.y = (this.canvas.height - this.paddleHeight) / 2;
    this.p2.y = (this.canvas.height - this.paddleHeight) / 2;
    this.resetBall();
    this.onScoreUpdate(this.p1.score);
  }

  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    const speed = 6;
    const angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
    const direction = Math.random() < 0.5 ? 1 : -1;

    this.ball.dx = direction * speed * Math.cos(angle);
    this.ball.dy = speed * Math.sin(angle);
  }

  stop() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
  }

  loop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();

    this.animId = requestAnimationFrame(() => this.loop());
  }

  update() {
    // Player 1 Move
    this.p1.y += this.p1.dy;
    this.p1.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.p1.y));

    // Player 2 / AI Move
    if (this.isTwoPlayer) {
      this.p2.y += this.p2.dy;
    } else {
      // Smart AI with reaction delay
      const p2Center = this.p2.y + this.paddleHeight / 2;
      const targetY = this.ball.y;
      if (Math.abs(p2Center - targetY) > 10) {
        if (p2Center < targetY) {
          this.p2.y += this.p2.speed * this.aiDifficulty;
        } else {
          this.p2.y -= this.p2.speed * this.aiDifficulty;
        }
      }
    }
    this.p2.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.p2.y));

    // Ball Move
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Top/Bottom Bounce
    if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
      this.ball.dy *= -1;
      window.arcadeAudio.playBounce();
    }

    // Paddle 1 Collision
    if (
      this.ball.x - this.ball.radius <= this.p1.x + this.paddleWidth &&
      this.ball.y >= this.p1.y &&
      this.ball.y <= this.p1.y + this.paddleHeight
    ) {
      const hitPos = (this.ball.y - (this.p1.y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
      this.ball.dx = Math.abs(this.ball.dx) * 1.05; // Slightly speed up
      this.ball.dy = hitPos * 7;
      this.ball.x = this.p1.x + this.paddleWidth + this.ball.radius;
      window.arcadeAudio.playHit();
    }

    // Paddle 2 Collision
    if (
      this.ball.x + this.ball.radius >= this.p2.x &&
      this.ball.y >= this.p2.y &&
      this.ball.y <= this.p2.y + this.paddleHeight
    ) {
      const hitPos = (this.ball.y - (this.p2.y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
      this.ball.dx = -Math.abs(this.ball.dx) * 1.05;
      this.ball.dy = hitPos * 7;
      this.ball.x = this.p2.x - this.ball.radius;
      window.arcadeAudio.playHit();
    }

    // Scoring
    if (this.ball.x < 0) {
      this.p2.score++;
      window.arcadeAudio.playPoint();
      this.checkWinner();
      this.resetBall();
    } else if (this.ball.x > this.canvas.width) {
      this.p1.score++;
      this.onScoreUpdate(this.p1.score * 100);
      window.arcadeAudio.playPoint();
      this.checkWinner();
      this.resetBall();
    }
  }

  checkWinner() {
    if (this.p1.score >= this.winningScore || this.p2.score >= this.winningScore) {
      this.isRunning = false;
      const playerWon = this.p1.score >= this.winningScore;
      if (playerWon) window.arcadeAudio.playWin();
      else window.arcadeAudio.playGameOver();

      this.onGameOver(this.p1.score * 100);
    }
  }

  draw() {
    this.ctx.fillStyle = '#05070c';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Center Dashed Line
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    this.ctx.setLineDash([10, 10]);
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Paddle 1 (Neon Cyan)
    this.ctx.save();
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.fillRect(this.p1.x, this.p1.y, this.paddleWidth, this.paddleHeight);
    this.ctx.restore();

    // Paddle 2 (Neon Pink)
    this.ctx.save();
    this.ctx.shadowColor = '#ff0055';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#ff0055';
    this.ctx.fillRect(this.p2.x, this.p2.y, this.paddleWidth, this.paddleHeight);
    this.ctx.restore();

    // Ball (Neon Yellow)
    this.ctx.save();
    this.ctx.shadowColor = '#ffe600';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#ffe600';
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Scores Overlay
    this.ctx.font = '24px "Press Start 2P"';
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.fillText(this.p1.score, this.canvas.width / 4, 60);
    this.ctx.fillStyle = '#ff0055';
    this.ctx.fillText(this.p2.score, (3 * this.canvas.width) / 4, 60);
  }
}
