const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const statusEl = document.getElementById('status');

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;
ctx.scale(BLOCK, BLOCK);

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [
    [2, 2],
    [2, 2],
  ],
  T: [
    [0, 3, 0],
    [3, 3, 3],
  ],
  S: [
    [0, 4, 4],
    [4, 4, 0],
  ],
  Z: [
    [5, 5, 0],
    [0, 5, 5],
  ],
  J: [
    [6, 0, 0],
    [6, 6, 6],
  ],
  L: [
    [0, 0, 7],
    [7, 7, 7],
  ],
};

const COLORS = [
  null,
  '#38bdf8',
  '#fde047',
  '#a78bfa',
  '#22c55e',
  '#ef4444',
  '#3b82f6',
  '#fb923c',
];

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece() {
  const kinds = Object.keys(SHAPES);
  const kind = kinds[(Math.random() * kinds.length) | 0];
  return {
    pos: { x: (COLS / 2 | 0) - 1, y: 0 },
    matrix: SHAPES[kind].map(row => [...row]),
  };
}

function collide(board, player) {
  const { matrix, pos } = player;
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (matrix[y][x] !== 0) {
        const row = board[y + pos.y];
        if (!row || row[x + pos.x] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge(board, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix) {
  return matrix[0].map((_, idx) => matrix.map(row => row[idx]).reverse());
}

function clearLines() {
  let cleared = 0;

  outer: for (let y = ROWS - 1; y >= 0; y -= 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }

    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    cleared += 1;
    y += 1;
  }

  if (cleared > 0) {
    const lineScore = [0, 100, 300, 500, 800][cleared];
    state.lines += cleared;
    state.score += lineScore * state.level;
    state.level = Math.floor(state.lines / 10) + 1;
    dropInterval = Math.max(1000 - (state.level - 1) * 80, 120);
    updateHud();
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = COLORS[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);

        ctx.strokeStyle = 'rgba(2, 6, 23, 0.55)';
        ctx.lineWidth = 0.05;
        ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 0.02;
  for (let x = 0; x <= COLS; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ROWS);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(COLS, y);
    ctx.stroke();
  }
}

function draw() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, COLS, ROWS);
  drawGrid();
  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function playerDrop() {
  player.pos.y += 1;
  if (collide(board, player)) {
    player.pos.y -= 1;
    merge(board, player);
    clearLines();
    playerReset();
  }
  dropCounter = 0;
}

function playerHardDrop() {
  while (!collide(board, player)) {
    player.pos.y += 1;
  }
  player.pos.y -= 1;
  merge(board, player);
  clearLines();
  playerReset();
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(board, player)) {
    player.pos.x -= dir;
  }
}

function playerRotate() {
  const originalX = player.pos.x;
  const rotated = rotate(player.matrix);
  let offset = 1;

  player.matrix = rotated;
  while (collide(board, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (Math.abs(offset) > player.matrix[0].length) {
      player.matrix = rotate(rotate(rotate(player.matrix)));
      player.pos.x = originalX;
      return;
    }
  }
}

function playerReset() {
  player.matrix = randomPiece().matrix;
  player.pos.y = 0;
  player.pos.x = ((COLS / 2) | 0) - ((player.matrix[0].length / 2) | 0);

  if (collide(board, player)) {
    state.gameOver = true;
    statusEl.textContent = 'ゲームオーバー（Rで再開）';
  }
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  levelEl.textContent = String(state.level);
  linesEl.textContent = String(state.lines);
}

function resetGame() {
  board.forEach(row => row.fill(0));
  state.score = 0;
  state.level = 1;
  state.lines = 0;
  state.gameOver = false;
  state.paused = false;
  dropInterval = 1000;
  statusEl.textContent = 'ゲーム中';
  updateHud();
  playerReset();
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!state.paused && !state.gameOver) {
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      playerDrop();
    }
  }

  draw();
  requestAnimationFrame(update);
}

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    resetGame();
    return;
  }

  if (event.key.toLowerCase() === 'p') {
    if (!state.gameOver) {
      state.paused = !state.paused;
      statusEl.textContent = state.paused ? '一時停止中（Pで再開）' : 'ゲーム中';
    }
    return;
  }

  if (state.paused || state.gameOver) {
    return;
  }

  if (event.key === 'ArrowLeft') playerMove(-1);
  else if (event.key === 'ArrowRight') playerMove(1);
  else if (event.key === 'ArrowDown') playerDrop();
  else if (event.key === 'ArrowUp') playerRotate();
  else if (event.code === 'Space') {
    event.preventDefault();
    playerHardDrop();
  }
});

const board = createBoard();
const player = randomPiece();
const state = {
  score: 0,
  level: 1,
  lines: 0,
  paused: false,
  gameOver: false,
};

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

updateHud();
playerReset();
update();
