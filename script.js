/* ===================================================
   JOE'S DINNER - script.js
   Sokoban puzzle game with OpenAI stage generation
   =================================================== */

// ─────────────────────────────────────────────────────
//  CELL TYPES
// ─────────────────────────────────────────────────────
const CELL = {
  WALL:        '#',
  FLOOR:       ' ',
  PLAYER:      '@',
  BOX:         'B',
  GOAL:        'G',
  PLAYER_GOAL: '+',
  BOX_GOAL:    '*',
};

// Character SVG sprites (inline, no emoji dependency)
const CHAR_SVG = {
  Papa: `<svg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'>
    <rect x='10' y='4' width='12' height='12' rx='6' fill='#F4A460'/>
    <rect x='8' y='4' width='16' height='7' rx='4' fill='#2C1810'/>
    <rect x='12' y='9' width='3' height='2' rx='1' fill='#3D2B1F'/>
    <rect x='17' y='9' width='3' height='2' rx='1' fill='#3D2B1F'/>
    <rect x='13' y='13' width='6' height='2' rx='1' fill='#C47840'/>
    <rect x='8' y='16' width='16' height='12' rx='3' fill='#1E40AF'/>
    <rect x='4' y='17' width='6' height='9' rx='2' fill='#1E40AF'/>
    <rect x='22' y='17' width='6' height='9' rx='2' fill='#1E40AF'/>
    <rect x='9' y='28' width='5' height='4' rx='1' fill='#8B6B5A'/>
    <rect x='18' y='28' width='5' height='4' rx='1' fill='#8B6B5A'/>
  </svg>`,
  Mama: `<svg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'>
    <rect x='10' y='5' width='12' height='12' rx='6' fill='#FDBCB4'/>
    <path d='M8 9 Q16 2 24 9' fill='#1A0A0A'/>
    <rect x='8' y='6' width='16' height='6' rx='3' fill='#1A0A0A' opacity='0.5'/>
    <rect x='12' y='10' width='3' height='2' rx='1' fill='#3D2B1F'/>
    <rect x='17' y='10' width='3' height='2' rx='1' fill='#3D2B1F'/>
    <rect x='13' y='14' width='6' height='2' rx='1' fill='#E8806A'/>
    <rect x='9' y='17' width='14' height='11' rx='3' fill='#F0F0FF'/>
    <rect x='5' y='18' width='5' height='8' rx='2' fill='#F0F0FF'/>
    <rect x='22' y='18' width='5' height='8' rx='2' fill='#F0F0FF'/>
    <rect x='10' y='28' width='4' height='4' rx='1' fill='#8B6B5A'/>
    <rect x='18' y='28' width='4' height='4' rx='1' fill='#8B6B5A'/>
  </svg>`,
  Bro: `<svg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'>
    <rect x='10' y='5' width='12' height='12' rx='6' fill='#F4C896'/>
    <path d='M8 8 Q16 3 24 8 Q22 5 16 5 Q10 5 8 8Z' fill='#8B5E3C'/>
    <rect x='12' y='10' width='3' height='2' rx='1' fill='#3D2B1F'/>
    <rect x='17' y='10' width='3' height='2' rx='1' fill='#3D2B1F'/>
    <rect x='13' y='14' width='6' height='2' rx='1' fill='#C47840'/>
    <rect x='8' y='17' width='16' height='11' rx='3' fill='#FFFFFF'/>
    <rect x='4' y='18' width='5' height='8' rx='2' fill='#FFFFFF'/>
    <rect x='23' y='18' width='5' height='8' rx='2' fill='#FFFFFF'/>
    <rect x='9' y='28' width='5' height='4' rx='1' fill='#4488DD'/>
    <rect x='18' y='28' width='5' height='4' rx='1' fill='#4488DD'/>
  </svg>`,
  Sis: `<svg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'>
    <rect x='10' y='5' width='12' height='12' rx='6' fill='#FDBCB4'/>
    <path d='M8 9 Q10 3 16 4 Q22 3 24 9' fill='#2C1810'/>
    <circle cx='8' cy='12' r='2' fill='#FF6B9D' opacity='0.6'/>
    <circle cx='24' cy='12' r='2' fill='#FF6B9D' opacity='0.6'/>
    <rect x='12' y='10' width='3' height='2' rx='1' fill='#3D2B1F'/>
    <rect x='17' y='10' width='3' height='2' rx='1' fill='#3D2B1F'/>
    <rect x='13' y='14' width='6' height='2' rx='1' fill='#E8806A'/>
    <rect x='8' y='17' width='16' height='11' rx='3' fill='#FF6B9D'/>
    <rect x='4' y='18' width='5' height='8' rx='2' fill='#FF6B9D'/>
    <rect x='23' y='18' width='5' height='8' rx='2' fill='#FF6B9D'/>
    <rect x='9' y='28' width='5' height='4' rx='1' fill='#8B6B5A'/>
    <rect x='18' y='28' width='5' height='4' rx='1' fill='#8B6B5A'/>
  </svg>`,
};

function makeCharEl(charName, size=40) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;`;
  wrap.innerHTML = CHAR_SVG[charName] || CHAR_SVG.Papa;
  const svg = wrap.querySelector('svg');
  if (svg) { svg.style.width = size+'px'; svg.style.height = size+'px'; }
  return wrap;
}

// Joe the Miniature Schnauzer SVG
function makeJoeEl(size=40) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;`;
  wrap.innerHTML = `<svg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
    <!-- body -->
    <rect x='6' y='16' width='20' height='12' rx='4' fill='#A0A0B0'/>
    <!-- legs -->
    <rect x='7' y='25' width='4' height='6' rx='2' fill='#E8E8F0'/>
    <rect x='13' y='25' width='4' height='6' rx='2' fill='#E8E8F0'/>
    <rect x='19' y='25' width='4' height='6' rx='2' fill='#E8E8F0'/>
    <!-- head -->
    <rect x='18' y='8' width='12' height='12' rx='5' fill='#A0A0B0'/>
    <!-- ear -->
    <rect x='26' y='6' width='4' height='7' rx='2' fill='#808090'/>
    <!-- eye -->
    <circle cx='27' cy='13' r='1.5' fill='#2C1810'/>
    <circle cx='27.5' cy='12.5' r='0.5' fill='white'/>
    <!-- long eyelash -->
    <line x1='26' y1='11' x2='24' y2='9' stroke='#2C1810' stroke-width='0.8' stroke-linecap='round'/>
    <line x1='27' y1='11' x2='26' y2='8.5' stroke='#2C1810' stroke-width='0.8' stroke-linecap='round'/>
    <line x1='28' y1='11' x2='28' y2='8.5' stroke='#2C1810' stroke-width='0.8' stroke-linecap='round'/>
    <!-- beard/mustache -->
    <rect x='18' y='17' width='12' height='5' rx='3' fill='#E8E8F0'/>
    <rect x='20' y='19' width='4' height='3' rx='2' fill='#D0D0E0'/>
    <rect x='26' y='19' width='4' height='3' rx='2' fill='#D0D0E0'/>
    <!-- nose -->
    <rect x='28' y='16' width='3' height='2' rx='1' fill='#2C1810'/>
    <!-- tail -->
    <rect x='4' y='14' width='4' height='7' rx='2' fill='#808090' transform='rotate(-20 6 17)'/>
  </svg>`;
  return wrap;
}

// Fallback stages (used if API fails) - carefully crafted, all solvable
const FALLBACK_STAGES = [
  // Level 1
  {
    grid: [
      '#######',
      '#     #',
      '#  @  #',
      '#  B  #',
      '#  G  #',
      '#     #',
      '#######',
    ],
    hint: 'Push Joe straight down to his bowl!',
  },
  // Level 2
  {
    grid: [
      '#######',
      '#     #',
      '# @   #',
      '# B # #',
      '#   G #',
      '#     #',
      '#######',
    ],
    hint: 'Watch the wall. Push right then down.',
  },
  // Level 3
  {
    grid: [
      '########',
      '#      #',
      '# @    #',
      '# B ## #',
      '#    G #',
      '#      #',
      '########',
    ],
    hint: 'Navigate around the walls carefully!',
  },
  // Level 4
  {
    grid: [
      '#########',
      '#   #   #',
      '# @   B #',
      '#   #   #',
      '# G   # #',
      '#       #',
      '#########',
    ],
    hint: 'The wall in the middle is tricky!',
  },
  // Level 5 - two boxes
  {
    grid: [
      '#########',
      '#   #   #',
      '# B @ B #',
      '# #   # #',
      '# G   G #',
      '#       #',
      '#########',
    ],
    hint: 'Two dogs, two bowls. Think twice!',
  },
  // Level 6
  {
    grid: [
      '##########',
      '#        #',
      '# B ## B #',
      '#  @     #',
      '# G ## G #',
      '#        #',
      '##########',
    ],
    hint: 'Walls everywhere. Plan each push!',
  },
  // Level 7+
  {
    grid: [
      '##########',
      '#  #     #',
      '# B  # B #',
      '#  @ #   #',
      '# G    G #',
      '#   ##   #',
      '##########',
    ],
    hint: 'Advanced! Every move counts.',
  },
];

// ─────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────
let selectedChar = 'Papa';
let selectedLevel = 1;
let board = [];
let playerPos = { x: 0, y: 0 };
let steps = 0;
let goalCount = 0;
let currentStageData = null;
let isAnimating = false;

// ─────────────────────────────────────────────────────
//  DOM REFS
// ─────────────────────────────────────────────────────
const selectScreen  = document.getElementById('selectScreen');
const gameScreen    = document.getElementById('gameScreen');
const clearScreen   = document.getElementById('clearScreen');
const gameBoard     = document.getElementById('gameBoard');
const loadingOverlay= document.getElementById('loadingOverlay');
const hintText      = document.getElementById('hintText');
const headerChar    = document.getElementById('headerChar');
const headerLevel   = document.getElementById('headerLevel');
const headerSteps   = document.getElementById('headerSteps');
const clearSteps    = document.getElementById('clearSteps');
const commentText   = document.getElementById('commentText');
const commentChar   = document.getElementById('commentChar');

// ─────────────────────────────────────────────────────
//  SCREEN MANAGEMENT
// ─────────────────────────────────────────────────────
function showScreen(screen) {
  [selectScreen, gameScreen, clearScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ─────────────────────────────────────────────────────
//  CHARACTER SELECT
// ─────────────────────────────────────────────────────
document.querySelectorAll('.char-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedChar = btn.dataset.char;
  });
});
// Default select Papa
document.querySelector('.char-btn[data-char="Papa"]').classList.add('selected');

// Level select
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLevel = parseInt(btn.dataset.level);
  });
});

// Play button
document.getElementById('playBtn').addEventListener('click', () => {
  startGame(selectedLevel);
});

// Back button
document.getElementById('backBtn').addEventListener('click', () => {
  showScreen(selectScreen);
});

// Reset button
document.getElementById('resetBtn').addEventListener('click', () => {
  if (currentStageData) loadStage(currentStageData);
});

// Next / Retry buttons
document.getElementById('nextBtn').addEventListener('click', () => {
  selectedLevel = Math.min(selectedLevel + 1, 9);
  // Update level button UI
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.level-btn[data-level="${selectedLevel}"]`)?.classList.add('active');
  startGame(selectedLevel);
});
document.getElementById('retryBtn').addEventListener('click', () => {
  showScreen(gameScreen);
  if (currentStageData) loadStage(currentStageData);
});

// ─────────────────────────────────────────────────────
//  START GAME
// ─────────────────────────────────────────────────────
async function startGame(level) {
  showScreen(gameScreen);
  headerChar.textContent  = selectedChar;
  headerLevel.textContent = `Level ${level}`;
  steps = 0;
  headerSteps.textContent = 'Steps: 0';
  hintText.textContent    = 'Loading puzzle...';
  loadingOverlay.classList.remove('hidden');
  gameBoard.innerHTML = '';

  // Try AI generation, fallback if it fails
  try {
    const stageData = await fetchStage(level);
    currentStageData = stageData;
  } catch (e) {
    console.warn('AI stage failed, using fallback:', e);
    const idx = Math.min(level - 1, FALLBACK_STAGES.length - 1);
    currentStageData = FALLBACK_STAGES[idx];
  }

  loadStage(currentStageData);
  loadingOverlay.classList.add('hidden');
}

// ─────────────────────────────────────────────────────
//  FETCH STAGE FROM API
// ─────────────────────────────────────────────────────
async function fetchStage(level) {
  const res = await fetch('/.netlify/functions/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'stage', level }),
  });
  if (!res.ok) throw new Error('API error');
  return await res.json();
}

// ─────────────────────────────────────────────────────
//  LOAD STAGE
// ─────────────────────────────────────────────────────
function loadStage(stageData) {
  hintText.textContent = `💡 ${stageData.hint}`;
  steps = 0;
  headerSteps.textContent = 'Steps: 0';

  // Parse grid
  board = stageData.grid.map(row => row.split(''));
  goalCount = 0;

  // Find player position & count goals
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const c = board[y][x];
      if (c === CELL.PLAYER || c === CELL.PLAYER_GOAL) {
        playerPos = { x, y };
      }
      if (c === CELL.GOAL || c === CELL.PLAYER_GOAL || c === CELL.BOX_GOAL) {
        goalCount++;
      }
    }
  }

  renderBoard();
}

// ─────────────────────────────────────────────────────
//  RENDER BOARD
// ─────────────────────────────────────────────────────
function renderBoard() {
  if (!board.length) return;

  const rows = board.length;
  const cols = Math.max(...board.map(r => r.length));

  // Calculate cell size
  const boardWrap = document.querySelector('.board-wrap');
  const maxW = boardWrap.clientWidth  - 32;
  const maxH = boardWrap.clientHeight - 32;
  const cellByW = Math.floor(maxW / cols);
  const cellByH = Math.floor(maxH / rows);
  const cellSize = Math.max(32, Math.min(60, cellByW, cellByH));

  gameBoard.style.setProperty('--cell-size', `${cellSize}px`);
  gameBoard.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
  gameBoard.style.gridTemplateRows    = `repeat(${rows}, ${cellSize}px)`;

  gameBoard.innerHTML = '';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = board[y]?.[x] ?? ' ';
      const cell = document.createElement('div');
      cell.classList.add('cell');

      switch (c) {
        case CELL.WALL:
          cell.classList.add('cell-wall');
          cell.textContent = '';
          break;
        case CELL.FLOOR:
          cell.classList.add('cell-floor');
          break;
        case CELL.GOAL:
          cell.classList.add('cell-goal');
          cell.textContent = '🍖';
          break;
        case CELL.PLAYER:
          cell.classList.add('cell-player', 'cell-floor');
          cell.appendChild(makeCharEl(selectedChar, cellSize * 0.8));
          break;
        case CELL.PLAYER_GOAL:
          cell.classList.add('cell-player', 'cell-goal');
          cell.appendChild(makeCharEl(selectedChar, cellSize * 0.8));
          break;
        case CELL.BOX:
          cell.classList.add('cell-box', 'cell-floor');
          cell.appendChild(makeJoeEl(cellSize * 0.82));
          break;
        case CELL.BOX_GOAL:
          cell.classList.add('cell-box-on-goal');
          cell.appendChild(makeJoeEl(cellSize * 0.82));
          break;
        default:
          cell.classList.add('cell-floor');
      }

      gameBoard.appendChild(cell);
    }
  }
}

// ─────────────────────────────────────────────────────
//  MOVE
// ─────────────────────────────────────────────────────
function move(dx, dy) {
  if (isAnimating) return;
  const { x, y } = playerPos;
  const nx = x + dx;
  const ny = y + dy;

  if (ny < 0 || ny >= board.length || nx < 0 || nx >= board[ny].length) return;

  const target = board[ny]?.[nx];
  if (!target) return;

  // Wall
  if (target === CELL.WALL) return;

  // Box or box on goal
  if (target === CELL.BOX || target === CELL.BOX_GOAL) {
    const bnx = nx + dx;
    const bny = ny + dy;
    if (bny < 0 || bny >= board.length || bnx < 0 || bnx >= board[bny].length) return;
    const beyondBox = board[bny]?.[bnx];
    if (!beyondBox || beyondBox === CELL.WALL || beyondBox === CELL.BOX || beyondBox === CELL.BOX_GOAL) return;

    // Move box
    board[bny][bnx] = (beyondBox === CELL.GOAL) ? CELL.BOX_GOAL : CELL.BOX;
    board[ny][nx]   = (target === CELL.BOX_GOAL) ? CELL.GOAL : CELL.FLOOR;
  }

  // Move player
  const currentCell = board[y][x];
  board[y][x] = (currentCell === CELL.PLAYER_GOAL) ? CELL.GOAL : CELL.FLOOR;
  board[ny][nx] = (board[ny][nx] === CELL.GOAL) ? CELL.PLAYER_GOAL : CELL.PLAYER;
  playerPos = { x: nx, y: ny };

  steps++;
  headerSteps.textContent = `Steps: ${steps}`;

  renderBoard();
  checkWin();
}

// ─────────────────────────────────────────────────────
//  CHECK WIN
// ─────────────────────────────────────────────────────
function checkWin() {
  let boxesOnGoal = 0;
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x] === CELL.BOX_GOAL) boxesOnGoal++;
    }
  }
  if (boxesOnGoal >= goalCount) {
    setTimeout(() => triggerClear(), 300);
  }
}

// ─────────────────────────────────────────────────────
//  CLEAR
// ─────────────────────────────────────────────────────
async function triggerClear() {
  clearSteps.textContent = steps;
  commentChar.textContent = CHAR_EMOJI[selectedChar] || '👨';
  commentText.textContent = '...';
  showScreen(clearScreen);

  // Fetch AI comment
  try {
    const res = await fetch('/.netlify/functions/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'comment', playerName: selectedChar }),
    });
    const data = await res.json();
    commentText.textContent = data.comment || 'Great job! Joe is happy! 🐕';
  } catch {
    const fallbacks = {
      Papa:  "That's my move! Joe deserves this dinner!",
      Mama:  "Well done, sweetheart! Joe looks so happy!",
      Bro:   "Nailed it. Joe's fed. No big deal.",
      Sis:   "Yay yay yay! Joe got his yummy dinner!!",
    };
    commentText.textContent = fallbacks[selectedChar] || "Great job! Joe is happy! 🐕";
  }
}

// ─────────────────────────────────────────────────────
//  KEYBOARD INPUT
// ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!gameScreen.classList.contains('active')) return;
  switch (e.key) {
    case 'ArrowUp':    e.preventDefault(); move(0, -1); break;
    case 'ArrowDown':  e.preventDefault(); move(0,  1); break;
    case 'ArrowLeft':  e.preventDefault(); move(-1, 0); break;
    case 'ArrowRight': e.preventDefault(); move( 1, 0); break;
    case 'r': case 'R': if (currentStageData) loadStage(currentStageData); break;
  }
});

// ─────────────────────────────────────────────────────
//  MOBILE CONTROLS
// ─────────────────────────────────────────────────────
document.getElementById('upBtn').addEventListener('click',    () => move(0, -1));
document.getElementById('downBtn2').addEventListener('click', () => move(0,  1));
document.getElementById('leftBtn2').addEventListener('click', () => move(-1, 0));
document.getElementById('rightBtn2').addEventListener('click',() => move( 1, 0));

// ─────────────────────────────────────────────────────
//  TOUCH SWIPE ON BOARD
// ─────────────────────────────────────────────────────
let touchStartX = 0, touchStartY = 0;
gameBoard.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });
gameBoard.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? 1 : -1, 0);
  } else {
    move(0, dy > 0 ? 1 : -1);
  }
}, { passive: true });

// ─────────────────────────────────────────────────────
//  RESIZE
// ─────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (gameScreen.classList.contains('active') && board.length) renderBoard();
});

// ─────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────
// Inject SVG character previews into select screen
['Papa','Mama','Bro','Sis'].forEach(name => {
  const el = document.getElementById('preview'+name);
  if (el) el.appendChild(makeCharEl(name, 48));
});
// Inject Joe preview too if needed
showScreen(selectScreen);
