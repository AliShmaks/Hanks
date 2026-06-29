
// ========== LOADER ==========
let loaderStartTime = Date.now();

function hideLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const elapsed = Date.now() - loaderStartTime;
    const remaining = Math.max(0, 900 - elapsed);
    setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => { loader.style.display = 'none'; }, 500);
    }, remaining);
}

window.addEventListener('load', hideLoader);
setTimeout(hideLoader, 3000);

// ========== SCROLL PROGRESS ==========
let scrollTicking = false;

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const progressBar = document.getElementById('scrollProgress');
            if (progressBar) {
                progressBar.style.width = (height > 0 ? (scrollY / height) * 100 : 0) + '%';
            }
            scrollTicking = false;
        });
        scrollTicking = true;
    }
});

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ========== XO GAME LOGIC ==========
let board = Array(9).fill('');
let currentPlayer = 'X';
let gameOver = false;
let scores = { X: 0, O: 0, D: 0 };
let gameMode = 'vsBot';
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function initBoard() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameOver = false;
    updateStatus();
    renderBoard();
}

function renderBoard() {
    const boardEl = document.getElementById('xoBoard');
    if (!boardEl) return;
    
    boardEl.innerHTML = board.map((value, index) => {
        let cellClass = 'xo-cell';
        if (value === 'X') cellClass += ' x-mark taken';
        if (value === 'O') cellClass += ' o-mark taken';
        return `<div class="${cellClass}" onclick="makeMove(${index})">${value}</div>`;
    }).join('');
}

function makeMove(position) {
    if (gameOver) return;
    if (gameMode === 'vsBot' && currentPlayer !== 'X') return;
    if (board[position]) return;
    
    placeMove(position);
}

function placeMove(position) {
    board[position] = currentPlayer;
    renderBoard();
    
    const winner = checkWin();
    if (winner) {
        gameOver = true;
        scores[winner]++;
        updateScores();
        highlightWinningCells(winner);
        updateStatus(winner === 'X' ? 'You Win! 🎉' : 'Bot Wins! 🤖');
        return;
    }
    
    if (board.every(cell => cell !== '')) {
        gameOver = true;
        scores.D++;
        updateScores();
        updateStatus("Draw! 🤝");
        return;
    }
    
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
    
    if (gameMode === 'vsBot' && !gameOver && currentPlayer === 'O') {
        setTimeout(() => botMove(), 300);
    }
}

function botMove() {
    if (gameOver) return;
    if (currentPlayer !== 'O') return;
    
    const bestMove = getBestMove();
    if (bestMove !== -1) {
        placeMove(bestMove);
    }
}

function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

function minimax(boardState, depth, isMaximizing) {
    const winner = checkWinnerOnBoard(boardState);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (boardState.every(cell => cell !== '')) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (boardState[i] === '') {
                boardState[i] = 'O';
                let score = minimax(boardState, depth + 1, false);
                boardState[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (boardState[i] === '') {
                boardState[i] = 'X';
                let score = minimax(boardState, depth + 1, true);
                boardState[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinnerOnBoard(boardState) {
    for (const [a, b, c] of winPatterns) {
        if (boardState[a] && boardState[a] === boardState[b] && boardState[b] === boardState[c]) {
            return boardState[a];
        }
    }
    return null;
}

function checkWin() {
    for (const [a, b, c] of winPatterns) {
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function highlightWinningCells(winner) {
    for (const [a, b, c] of winPatterns) {
        if (board[a] && board[a] === board[b] && board[b] === board[c] && board[a] === winner) {
            const cells = document.querySelectorAll('.xo-cell');
            [a, b, c].forEach(idx => {
                if (cells[idx]) cells[idx].classList.add('win-cell');
            });
            break;
        }
    }
}

function updateStatus(message) {
    const statusEl = document.getElementById('xoStatus');
    if (!statusEl) return;
    if (message) {
        statusEl.textContent = message;
    } else if (gameMode === 'vsBot') {
        statusEl.textContent = currentPlayer === 'X' ? "Your Turn 👆" : "Bot is thinking... 🤖";
    } else {
        statusEl.textContent = `${currentPlayer}'s Turn`;
    }
}

function updateScores() {
    const scoreX = document.getElementById('scoreX');
    const scoreO = document.getElementById('scoreO');
    const scoreD = document.getElementById('scoreD');
    if (scoreX) scoreX.textContent = scores.X;
    if (scoreO) scoreO.textContent = scores.O;
    if (scoreD) scoreD.textContent = scores.D;
}

function resetXO() {
    initBoard();
}

function resetScores() {
    scores = { X: 0, O: 0, D: 0 };
    updateScores();
    initBoard();
}

function toggleXOMode() {
    gameMode = gameMode === 'vsBot' ? 'vsPlayer' : 'vsBot';
    resetXO();
    const modeBtn = document.getElementById('xoModeToggle');
    if (modeBtn) {
        modeBtn.textContent = gameMode === 'vsBot' ? '🤖 vs Bot' : '👥 2 Players';
    }
    showToast(gameMode === 'vsBot' ? 'Switched to VS Bot mode' : 'Switched to 2 Player mode');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ========== NAVBAR FUNCTIONS ==========
function toggleMenuDropdown() {
    const dropdown = document.getElementById('menuDropdown');
    const arrow = document.getElementById('ddArrow');
    if (dropdown) {
        dropdown.classList.toggle('open');
        if (arrow) {
            arrow.style.transform = dropdown.classList.contains('open') ? 'rotate(180deg)' : '';
        }
    }
}

document.addEventListener('click', function(e) {
    const wrap = document.getElementById('menuDropdownWrap');
    if (wrap && !wrap.contains(e.target)) {
        const dropdown = document.getElementById('menuDropdown');
        const arrow = document.getElementById('ddArrow');
        if (dropdown) dropdown.classList.remove('open');
        if (arrow) arrow.style.transform = '';
    }
});

const menuTrigger = document.getElementById('menuTrigger');
if (menuTrigger) {
    menuTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        toggleMenuDropdown();
    });
}

// ========== MOBILE MENU ==========
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');

function openMobileMenu() {
    if (mobileMenu) mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    if (mobileMenu) mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMobileMenu);

document.querySelectorAll('.mobile-menu-links a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
        closeMobileMenu();
    }
});

// ========== CART BADGE ==========
function updateCartBadge() {
    let cart = JSON.parse(sessionStorage.getItem('hanks_cart')) || [];
    const total = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        if (total > 0) {
            badge.textContent = total;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

window.addEventListener('storage', function(e) {
    if (e.key === 'hanks_cart') {
        updateCartBadge();
    }
});

document.addEventListener('DOMContentLoaded', updateCartBadge);

// ========== INIT LUCIDE ICONS ==========
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

setTimeout(function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}, 500);

// ========== INIT GAME ==========
document.addEventListener('DOMContentLoaded', () => {
    initBoard();
});

// Make functions global
window.makeMove = makeMove;
window.resetXO = resetXO;
window.resetScores = resetScores;
window.toggleXOMode = toggleXOMode;