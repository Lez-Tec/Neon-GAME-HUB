/**
 * 2048 Fusion DOM/Grid Game Module
 */

class Game2048 {
  constructor(containerEl, onScoreUpdate, onGameOver) {
    this.container = containerEl;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.size = 4;
    this.grid = [];
    this.score = 0;
    this.isRunning = false;

    this.bindControls();
  }

  bindControls() {
    this.keydownHandler = (e) => {
      if (!this.isRunning) return;

      let moved = false;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          moved = this.moveUp();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moved = this.moveDown();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moved = this.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moved = this.moveRight();
          break;
      }

      if (moved) {
        window.arcadeAudio.playSlide();
        this.addRandomTile();
        this.render();
        this.onScoreUpdate(this.score);

        if (this.checkGameOver()) {
          this.isRunning = false;
          window.arcadeAudio.playGameOver();
          this.onGameOver(this.score);
        }
      }
    };

    window.addEventListener('keydown', this.keydownHandler);
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.addRandomTile();
    this.addRandomTile();
    this.render();
  }

  reset() {
    this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.onScoreUpdate(0);
  }

  stop() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.keydownHandler);
  }

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }

    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  slideRow(row) {
    let arr = row.filter(val => val !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        this.score += arr[i];
        window.arcadeAudio.playMerge();
        arr[i + 1] = 0;
      }
    }
    arr = arr.filter(val => val !== 0);
    while (arr.length < this.size) arr.push(0);
    return arr;
  }

  moveLeft() {
    let moved = false;
    for (let r = 0; r < this.size; r++) {
      const original = [...this.grid[r]];
      const next = this.slideRow(this.grid[r]);
      this.grid[r] = next;
      if (JSON.stringify(original) !== JSON.stringify(next)) moved = true;
    }
    return moved;
  }

  moveRight() {
    let moved = false;
    for (let r = 0; r < this.size; r++) {
      const original = [...this.grid[r]];
      const reversed = [...this.grid[r]].reverse();
      const slid = this.slideRow(reversed).reverse();
      this.grid[r] = slid;
      if (JSON.stringify(original) !== JSON.stringify(slid)) moved = true;
    }
    return moved;
  }

  moveUp() {
    let moved = false;
    for (let c = 0; c < this.size; c++) {
      const col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
      const slid = this.slideRow(col);
      for (let r = 0; r < this.size; r++) {
        if (this.grid[r][c] !== slid[r]) moved = true;
        this.grid[r][c] = slid[r];
      }
    }
    return moved;
  }

  moveDown() {
    let moved = false;
    for (let c = 0; c < this.size; c++) {
      const col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]].reverse();
      const slid = this.slideRow(col).reverse();
      for (let r = 0; r < this.size; r++) {
        if (this.grid[r][c] !== slid[r]) moved = true;
        this.grid[r][c] = slid[r];
      }
    }
    return moved;
  }

  checkGameOver() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return false;
        if (c < this.size - 1 && this.grid[r][c] === this.grid[r][c + 1]) return false;
        if (r < this.size - 1 && this.grid[r][c] === this.grid[r + 1][c]) return false;
      }
    }
    return true;
  }

  render() {
    this.container.innerHTML = '';
    const gridEl = document.createElement('div');
    gridEl.className = 'grid-2048';

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        const tile = document.createElement('div');
        tile.className = 'tile-2048';
        if (val > 0) {
          tile.setAttribute('data-val', val);
          tile.textContent = val;
        }
        gridEl.appendChild(tile);
      }
    }

    this.container.appendChild(gridEl);
  }
}
