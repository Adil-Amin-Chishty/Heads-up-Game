let NUM_COINS = 10;

// Panels / layout
const mainMenu = document.getElementById("mainMenu");
const rulesPanel = document.getElementById("rulesPanel");
const gamePanel = document.getElementById("gamePanel");
const quitPanel = document.getElementById("quitPanel");

// Game elements
const game = document.getElementById("game");
const movesText = document.getElementById("moves");
const minMovesText = document.getElementById("minMoves");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("winMessage");
const restartBtn = document.getElementById("restartBtn");
const autoSolveBtn = document.getElementById("autoSolveBtn");
const continueBtn = document.getElementById("continueBtn");
const difficultySelect = document.getElementById("difficultySelect");

// Menu / navigation buttons
const startGameBtn = document.getElementById("startGameBtn");
const rulesBtn = document.getElementById("rulesBtn");
const quitBtn = document.getElementById("quitBtn");
const rulesBackBtn = document.getElementById("rulesBackBtn");
const rulesStartBtn = document.getElementById("rulesStartBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const quitBackBtn = document.getElementById("quitBackBtn");

// Audio controls
const musicToggleBtn = document.getElementById("musicToggleBtn");
const musicVolumeSlider = document.getElementById("musicVolumeSlider");

// Audio elements
const flipSound = document.getElementById("flipSound");
const winSound = document.getElementById("winSound");
const bgMusic = document.getElementById("bgMusic");

let coins = [];
let moves = 0;
let startIndex = null;
let endIndex = null;
let isMusicOn = false;
let totalScore = 0;

function showPanel(which) {
    const panels = [mainMenu, rulesPanel, gamePanel, quitPanel];
    panels.forEach(panel => {
        if (!panel) return;
        panel.classList.add("hidden");
    });

    let target = null;
    if (which === "menu") target = mainMenu;
    if (which === "rules") target = rulesPanel;
    if (which === "game") target = gamePanel;
    if (which === "quit") target = quitPanel;

    if (target) {
        target.classList.remove("hidden");
    }
}

function toggleMusic(forceState) {
    if (!bgMusic) return;

    const nextState = typeof forceState === "boolean" ? forceState : !isMusicOn;
    isMusicOn = nextState;

    if (isMusicOn) {
        bgMusic.play().catch(() => {
            // Some browsers block autoplay; user can press again
        });
        if (musicToggleBtn) {
            musicToggleBtn.textContent = "🎵 Music: On";
        }
    } else {
        bgMusic.pause();
        if (musicToggleBtn) {
            musicToggleBtn.textContent = "🎵 Music: Off";
        }
    }
}

function setupAudio() {
    if (bgMusic) {
        const initial = musicVolumeSlider ? Number(musicVolumeSlider.value) / 100 : 0.25;
        bgMusic.volume = initial;
    }
    if (flipSound) flipSound.volume = 0.45;
    if (winSound) winSound.volume = 0.6;

    if (musicToggleBtn) {
        musicToggleBtn.addEventListener("click", () => toggleMusic());
    }

    if (musicVolumeSlider && bgMusic) {
        musicVolumeSlider.addEventListener("input", (e) => {
            const value = Number(e.target.value) || 0;
            bgMusic.volume = value / 100;
        });
    }
}

function setupNavigation() {
    if (startGameBtn) {
        startGameBtn.addEventListener("click", startGame);
    }
    if (rulesBtn) {
        rulesBtn.addEventListener("click", () => showPanel("rules"));
    }
    if (quitBtn) {
        quitBtn.addEventListener("click", () => showPanel("quit"));
    }
    if (rulesBackBtn) {
        rulesBackBtn.addEventListener("click", () => showPanel("menu"));
    }
    if (rulesStartBtn) {
        rulesStartBtn.addEventListener("click", startGame);
    }
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener("click", () => showPanel("menu"));
    }
    if (quitBackBtn) {
        quitBackBtn.addEventListener("click", () => showPanel("menu"));
    }
}

function startGame() {
    showPanel("game");
    initGame();
    if (!isMusicOn) {
        toggleMusic(true);
    }
}

function initGame() {
    NUM_COINS = parseInt(difficultySelect.value);
    game.innerHTML = "";
    coins = [];
    moves = 0;
    startIndex = null;
    endIndex = null;
    winMessage.style.display = "none";

    for (let i = 0; i < NUM_COINS; i++) {
        const isHead = Math.random() > 0.5;
        coins.push(isHead);

        const coin = document.createElement("div");
        coin.className = "coin " + (isHead ? "head" : "tail");
        coin.textContent = isHead ? "H" : "T";
        coin.dataset.index = i;

        coin.addEventListener("mousedown", () => {
            startIndex = i;
            endIndex = i;
            updateSelection();
        });

        coin.addEventListener("mouseover", () => {
            if (startIndex !== null) {
                endIndex = i;
                updateSelection();
            }
        });

        coin.addEventListener("mouseup", flipSelected);

        game.appendChild(coin);
    }

    updateUI();
}

function updateSelection() {
    document.querySelectorAll(".coin").forEach((coin, i) => {
        coin.classList.remove("selected");
        if (
            startIndex !== null &&
            i >= Math.min(startIndex, endIndex) &&
            i <= Math.max(startIndex, endIndex)
        ) {
            coin.classList.add("selected");
        }
    });
}

function flipSelected() {
    if (startIndex === null) return;

    const s = Math.min(startIndex, endIndex);
    const e = Math.max(startIndex, endIndex);

    for (let i = s; i <= e; i++) {
        coins[i] = !coins[i];
        createParticleEffect(i);
    }

    flipSound.currentTime = 0;
    flipSound.play();

    moves++;
    startIndex = null;
    endIndex = null;

    updateUI(true);
    checkWin();
}

function updateUI(withAnimation = false) {
    document.querySelectorAll(".coin").forEach((coin, i) => {
        coin.className = "coin " + (coins[i] ? "head" : "tail");
        coin.textContent = coins[i] ? "H" : "T";

        if (withAnimation) {
            coin.classList.add("flip");
            setTimeout(() => coin.classList.remove("flip"), 400);
        }
    });

    movesText.textContent = moves;
    minMovesText.textContent = calculateMinMoves();
    updateScore();
}

function calculateMinMoves() {
    let min = 0;
    for (let i = 0; i < coins.length; i++) {
        if (!coins[i] && (i === 0 || coins[i - 1])) min++;
    }
    return min;
}

function updateScore(finished = false) {
    const min = calculateMinMoves();
    let gained = 0;

    if (finished) {
        const ratio = moves > 0 ? Math.max(0, min / moves) : 0;
        if (ratio === 1) gained = 3;
        else if (ratio >= 0.7) gained = 2;
        else gained = 1;

        totalScore += gained;
    }

    scoreText.textContent = totalScore;
}

function checkWin() {
    if (coins.every(c => c)) {
        winMessage.style.display = "block";
        winSound.play();
        for (let i = 0; i < 50; i++) createParticleEffect(Math.floor(Math.random() * coins.length));
        updateScore(true);
    }
}

function autoSolve() {
    for (let i = 0; i < coins.length; i++) {
        if (!coins[i] && (i === 0 || coins[i - 1])) {
            let j = i;
            while (j < coins.length && !coins[j]) j++;
            for (let k = i; k < j; k++) coins[k] = true;
            moves++;
            createParticleEffect(i);
        }
    }
    flipSound.play();
    updateUI(true);
    checkWin();
}

// Particle effect for flip / win
function createParticleEffect(index) {
    const coinDiv = document.querySelectorAll(".coin")[index];
    if (!coinDiv) return;

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.background = `hsl(${Math.random()*360}, 80%, 60%)`;
        particle.style.left = coinDiv.offsetLeft + 25 + "px";
        particle.style.top = coinDiv.offsetTop + 25 + "px";
        document.body.appendChild(particle);

        const dx = (Math.random() - 0.5) * 100;
        const dy = (Math.random() - 0.5) * 100;

        particle.animate([
            { transform: `translate(0,0)`, opacity: 1 },
            { transform: `translate(${dx}px,${dy}px)`, opacity: 0 }
        ], {
            duration: 800 + Math.random()*400,
            easing: 'ease-out'
        });

        setTimeout(() => particle.remove(), 1200);
    }
}

restartBtn.addEventListener("click", () => {
    totalScore = 0;
    initGame();
});
autoSolveBtn.addEventListener("click", autoSolve);
difficultySelect.addEventListener("change", initGame);
continueBtn.addEventListener("click", initGame);

// Initial setup: show main menu, configure audio and navigation
setupAudio();
setupNavigation();
showPanel("menu");
