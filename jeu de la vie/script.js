class GameOfLife {
  constructor(width = 50, height = 50) {
    this.width = width;
    this.height = height;
    this.grid = this.createEmptyGrid();
    this.isRunning = false;
    this.speed = 100;
    this.selectedPattern = null;
    this.animationFrame = null;
    this.lastUpdate = 0;

    this.initializeDOM();
    this.initializePatternLibrary();
    this.setupEventListeners();
  }

  createEmptyGrid() {
    return Array(this.height)
      .fill()
      .map(() => Array(this.width).fill(false));
  }

  initializeDOM() {
    // Créer la grille
    const gridElement = document.getElementById("grid");
    gridElement.style.gridTemplateColumns = `repeat(${this.width}, 20px)`;

    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const cell = document.createElement("div");
        cell.className = "cell dead";
        cell.dataset.row = i;
        cell.dataset.col = j;
        gridElement.appendChild(cell);
      }
    }

    // Références des éléments DOM
    this.startBtn = document.getElementById("startBtn");
    this.speedBtn = document.getElementById("speedBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.libraryBtn = document.getElementById("libraryBtn");
    this.speedSelect = document.getElementById("speedSelect");
    this.patternsContainer = document.getElementById("patterns");
    this.patternIndicator = document.getElementById("patternIndicator");
    this.patternName = document.getElementById("patternName");
    this.cancelPatternBtn = document.getElementById("cancelPattern");
    this.gridElement = gridElement;
  }

  initializePatternLibrary() {
    Object.entries(patterns).forEach(([key, { name }]) => {
      const button = document.createElement("button");
      button.className = "pattern-btn";
      button.textContent = name;
      button.dataset.pattern = key;
      this.patternsContainer.appendChild(button);
    });
  }

  setupEventListeners() {
    // Contrôles principaux
    this.startBtn.addEventListener("click", () => this.toggleSimulation());
    this.speedBtn.addEventListener("click", () => this.increaseSpeed());
    this.resetBtn.addEventListener("click", () => this.reset());
    this.libraryBtn.addEventListener("click", () => this.toggleLibrary());
    this.speedSelect.addEventListener("change", (e) =>
      this.setSpeed(Number(e.target.value))
    );
    this.cancelPatternBtn.addEventListener("click", () =>
      this.cancelPatternSelection()
    );

    // Gestion de la grille
    this.gridElement.addEventListener("click", (e) => {
      const cell = e.target;
      if (cell.classList.contains("cell")) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        this.handleCellClick(row, col);
      }
    });

    // Gestion de la bibliothèque de motifs
    this.patternsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("pattern-btn")) {
        this.selectPattern(e.target.dataset.pattern);
      }
    });
  }

  toggleSimulation() {
    this.isRunning = !this.isRunning;
    this.startBtn.innerHTML = this.isRunning
      ? '<span class="icon">⏸</span><span class="btn-text">Pause</span>'
      : '<span class="icon">▶</span><span class="btn-text">Démarrer</span>';

    if (this.isRunning) {
      this.run();
    } else {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  increaseSpeed() {
    const newSpeed = Math.max(this.speed - 50, 50);
    this.speedSelect.value = newSpeed;
    this.setSpeed(newSpeed);
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  reset() {
    this.isRunning = false;
    this.grid = this.createEmptyGrid();
    this.updateDisplay();
    this.startBtn.innerHTML =
      '<span class="icon">▶</span><span class="btn-text">Démarrer</span>';
    cancelAnimationFrame(this.animationFrame);
    this.cancelPatternSelection();
  }

  toggleLibrary() {
    this.patternsContainer.classList.toggle("hidden");
    this.libraryBtn.classList.toggle("active");
  }

  selectPattern(patternKey) {
    const allPatternBtns =
      this.patternsContainer.querySelectorAll(".pattern-btn");
    allPatternBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.pattern === patternKey);
    });

    if (this.selectedPattern === patternKey) {
      this.cancelPatternSelection();
    } else {
      this.selectedPattern = patternKey;
      this.patternIndicator.classList.remove("hidden");
      this.patternName.textContent = `Mode placement: ${patterns[patternKey].name}`;
    }
  }

  cancelPatternSelection() {
    this.selectedPattern = null;
    this.patternIndicator.classList.add("hidden");
    const allPatternBtns =
      this.patternsContainer.querySelectorAll(".pattern-btn");
    allPatternBtns.forEach((btn) => btn.classList.remove("active"));
  }

  handleCellClick(row, col) {
    if (this.isRunning) return;

    if (this.selectedPattern) {
      this.placePattern(row, col);
    } else {
      this.grid[row][col] = !this.grid[row][col];
      this.updateCell(row, col);
    }
  }

  placePattern(startRow, startCol) {
    const pattern = patterns[this.selectedPattern].pattern;

    pattern.forEach((row, i) => {
      row.forEach((cell, j) => {
        const newRow = (startRow + i) % this.height;
        const newCol = (startCol + j) % this.width;
        this.grid[newRow][newCol] = cell === 1;
        this.updateCell(newRow, newCol);
      });
    });
  }

  updateCell(row, col) {
    const cell = this.gridElement.children[row * this.width + col];
    cell.classList.toggle("alive", this.grid[row][col]);
    cell.classList.toggle("dead", !this.grid[row][col]);
  }

  updateDisplay() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        this.updateCell(i, j);
      }
    }
  }

  countNeighbors(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newRow = (row + i + this.height) % this.height;
        const newCol = (col + j + this.width) % this.width;
        count += this.grid[newRow][newCol] ? 1 : 0;
      }
    }
    return count;
  }

  step() {
    const newGrid = this.createEmptyGrid();

    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const neighbors = this.countNeighbors(i, j);
        if (this.grid[i][j]) {
          newGrid[i][j] = neighbors === 2 || neighbors === 3;
        } else {
          newGrid[i][j] = neighbors === 3;
        }
      }
    }

    this.grid = newGrid;
    this.updateDisplay();
  }

  run(timestamp = 0) {
    if (!this.isRunning) return;

    if (timestamp - this.lastUpdate >= this.speed) {
      this.step();
      this.lastUpdate = timestamp;
    }

    this.animationFrame = requestAnimationFrame((t) => this.run(t));
  }
}

// Initialiser le jeu
document.addEventListener("DOMContentLoaded", () => {
  const game = new GameOfLife();
});
