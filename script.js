// ========= LocalStorage Keys =========
const LS_MG_BEST = "minigame_best_v3";
const LS_VOCABS = "vocabs_v3";

// ========= Game Variables =========
let mgCards = [];
let mgFirst = null;
let mgSecond = null;
let mgLock = false;
let mgMoves = 0;
let mgMatches = 0;
let mgTimer = null;
let mgSeconds = 0;
let mgRunning = false;
let currentLevel = 8;
let matchStreak = 0;
let lastMatchTime = 0;

// ========= DOM Elements =========
const mgStartBtn = document.getElementById("mgStart");
const mgPlayAgainBtn = document.getElementById("mgPlayAgain");
const mgBoard = document.getElementById("mgBoard");
const mgInfo = document.getElementById("mgInfo");
const mgTimeEl = document.getElementById("mgTime");
const mgMovesEl = document.getElementById("mgMoves");
const mgMatchesEl = document.getElementById("mgMatches");
const mgBestEl = document.getElementById("mgBest");
const mgWin = document.getElementById("mgWin");
const mgWinText = document.getElementById("mgWinText");
const mgProgress = document.getElementById("mgProgress");
const levelBtnsModern = document.querySelectorAll(".level-btn-modern");

// ========= Level-Button Events =========
levelBtnsModern.forEach(btn => {
    btn.addEventListener("click", function () {
        levelBtnsModern.forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        currentLevel = parseInt(this.dataset.level);
        mgRefreshBest();
        mgInfo.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Level ${currentLevel} ausgewählt. Starte das Spiel!</span>
        `;
    });
});

// ========= Game Functions =========
mgStartBtn.addEventListener("click", mgStart);
mgPlayAgainBtn.addEventListener("click", mgStart);

function mgResetUI(message = "") {
    mgBoard.innerHTML = "";
    mgInfo.innerHTML = message;
    mgWin.style.display = "none";
    mgMoves = 0;
    mgMatches = 0;
    mgSeconds = 0;
    mgRunning = false;
    mgFirst = null;
    mgSecond = null;
    mgLock = false;
    matchStreak = 0;
    mgMovesEl.textContent = "0";
    mgMatchesEl.textContent = "0";
    mgTimeEl.textContent = "00:00";
    mgProgress.style.width = "0%";
    mgStopTimer();
    mgRefreshBest();
}

function mgStart() {
    const vocabs = loadVocabs();
    if (!vocabs.length) {
        mgResetUI(`
            <i class="fas fa-exclamation-triangle"></i>
            <span>Bitte zuerst Vokabeln anlegen (im Vokabeltrainer).</span>
        `);
        return;
    }

    mgWin.style.display = "none";
    mgInfo.innerHTML = `
        <div class="loading">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        </div>
        <div style="margin-top: 10px;">Spiel wird vorbereitet...</div>
    `;

    mgMoves = 0;
    mgMatches = 0;
    mgSeconds = 0;
    mgMovesEl.textContent = "0";
    mgMatchesEl.textContent = "0";
    mgTimeEl.textContent = "00:00";
    mgProgress.style.width = "0%";
    mgStopTimer();

    mgFirst = null;
    mgSecond = null;
    mgLock = false;
    mgRunning = true;
    matchStreak = 0;

    const pairs = currentLevel;
    const pool = shuffle([...vocabs]).slice(0, Math.min(pairs, vocabs.length));

    if (pool.length < pairs) {
        mgInfo.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <span>Nicht genug Vokabeln für Level ${pairs}. Füge mehr Vokabeln hinzu!</span>
        `;
        mgRunning = false;
        return;
    }

    mgCards = [];
    pool.forEach(v => {
        mgCards.push({
            id: randomId(),
            pairId: v.id || v.q,
            type: "Wort",
            text: v.q,
            matched: false,
            flipped: false
        });
        mgCards.push({
            id: randomId(),
            pairId: v.id || v.q,
            type: "Übersetzung",
            text: v.a,
            matched: false,
            flipped: false
        });
    });

    mgCards = shuffle(mgCards);

    setTimeout(() => {
        mgRenderBoard(mgCards);
        mgInfo.innerHTML = `
            <i class="fas fa-lightbulb"></i>
            <span>Level ${currentLevel} - Finde die Wortpaare!</span>
        `;

        // Preview animation
        const cards = document.querySelectorAll('.card-game-modern');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('flipped');
                setTimeout(() => {
                    card.classList.remove('flipped');
                    if (index === cards.length - 1) {
                        mgStartTimer();
                    }
                }, 800);
            }, index * 100);
        });
    }, 1000);
}

function mgRenderBoard(cards) {
    mgBoard.innerHTML = '';

    cards.forEach(card => {
        const el = document.createElement('div');
        el.className = 'card-game-modern';
        el.dataset.id = card.id;

        el.innerHTML = `
            <div class="card-front">
                <div class="card-type-modern">Memory</div>
            </div>
            <div class="card-back">
                <div class="card-text-modern">${escapeHtml(card.text)}</div>
                <div class="card-type-modern">${escapeHtml(card.type)}</div>
            </div>
        `;

        el.addEventListener('click', () => mgFlip(card.id));
        mgBoard.appendChild(el);
    });

    const numCards = cards.length;
    let columns = 5;
    if (numCards <= 12) columns = 4;
    if (numCards <= 8) columns = 3;
    if (numCards <= 4) columns = 2;

    mgBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
}

function mgFlip(cardId) {
    if (!mgRunning || mgLock) return;

    const card = mgCards.find(c => c.id === cardId);
    if (!card || card.matched || card.flipped) return;

    const el = mgGetCardEl(cardId);
    if (!el) return;

    // Flip animation
    el.classList.add('flip-animation', 'flipped');
    card.flipped = true;

    if (!mgFirst) {
        mgFirst = card;
        return;
    }

    if (mgFirst.id === cardId) return;

    mgSecond = card;
    mgMoves++;
    mgMovesEl.textContent = mgMoves;

    // Update progress bar
    const progress = (mgMatches / (mgCards.length / 2)) * 100;
    mgProgress.style.width = `${progress}%`;

    mgLock = true;

    const isMatch = (mgFirst.pairId === mgSecond.pairId) && (mgFirst.type !== mgSecond.type);

    setTimeout(() => {
        if (isMatch) {
            // Match found
            card.matched = true;
            mgFirst.matched = true;

            mgGetCardEl(mgFirst.id)?.classList.add('matched', 'match-animation');
            mgGetCardEl(mgSecond.id)?.classList.add('matched', 'match-animation');

            mgMatches++;
            mgMatchesEl.textContent = mgMatches;

            // Streak logic
            const currentTime = Date.now();
            if (currentTime - lastMatchTime < 2000) {
                matchStreak++;
            } else {
                matchStreak = 1;
            }
            lastMatchTime = currentTime;

            // Show streak message
            if (matchStreak > 1) {
                showStreakMessage(matchStreak);
            }

            mgFirst = null;
            mgSecond = null;
            mgLock = false;

            // Update progress bar
            const newProgress = (mgMatches / (mgCards.length / 2)) * 100;
            mgProgress.style.width = `${newProgress}%`;

            if (mgMatches === mgCards.length / 2) {
                setTimeout(() => mgWinGame(), 500);
            }
        } else {
            // No match
            mgGetCardEl(mgFirst.id)?.classList.add('wrong-animation');
            mgGetCardEl(mgSecond.id)?.classList.add('wrong-animation');

            matchStreak = 0;

            setTimeout(() => {
                mgGetCardEl(mgFirst.id)?.classList.remove('flipped', 'wrong-animation');
                mgGetCardEl(mgSecond.id)?.classList.remove('flipped', 'wrong-animation');
                mgFirst.flipped = false;
                mgSecond.flipped = false;
                mgFirst = null;
                mgSecond = null;
                mgLock = false;
            }, 1000);
        }
    }, 600);
}

function mgWinGame() {
    mgRunning = false;
    mgStopTimer();

    const timeStr = mgFormatTime(mgSeconds);
    const score = calculateScore(mgSeconds, mgMoves, currentLevel);

    mgWin.style.display = 'block';
    mgWinText.innerHTML = `
        <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">
            🏆 Level ${currentLevel} abgeschlossen!
        </div>
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); 
                    padding: 1.5rem; 
                    border-radius: 15px; 
                    color: white;
                    margin: 1rem 0;">
            <div><i class="fas fa-clock"></i> Zeit: <b>${timeStr}</b></div>
            <div><i class="fas fa-sync-alt"></i> Züge: <b>${mgMoves}</b></div>
            <div><i class="fas fa-star"></i> Score: <b>${score}</b></div>
        </div>
    `;

    const best = mgGetBest(currentLevel);
    if (best == null || mgSeconds < best) {
        mgSetBest(currentLevel, mgSeconds);
        mgRefreshBest();
        mgInfo.innerHTML = `
            <i class="fas fa-trophy"></i>
            <span>🎉 NEUE BESTZEIT! Du hast deinen eigenen Rekord gebrochen!</span>
        `;
    } else {
        const timeDiff = mgSeconds - best;
        mgInfo.innerHTML = `
            <i class="fas fa-medal"></i>
            <span>✅ Super Leistung! Bestzeit: ${mgFormatTime(best)}</span>
        `;
    }
}

function mgGetCardEl(id) {
    return mgBoard.querySelector(`.card-game-modern[data-id="${CSS.escape(id)}"]`);
}

function mgStartTimer() {
    mgStopTimer();
    mgTimer = setInterval(() => {
        mgSeconds++;
        mgTimeEl.textContent = mgFormatTime(mgSeconds);
        
        // Add pulse animation every 10 seconds
        if (mgSeconds % 10 === 0) {
            mgTimeEl.classList.add('pulse');
            setTimeout(() => mgTimeEl.classList.remove('pulse'), 1000);
        }
    }, 1000);
}

function mgStopTimer() {
    if (mgTimer) {
        clearInterval(mgTimer);
        mgTimer = null;
    }
}

function mgFormatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function mgGetBest(level) {
    try {
        const obj = JSON.parse(localStorage.getItem(LS_MG_BEST) || "{}");
        return (typeof obj[level] === "number") ? obj[level] : null;
    } catch {
        return null;
    }
}

function mgSetBest(level, sec) {
    const obj = (() => {
        try {
            return JSON.parse(localStorage.getItem(LS_MG_BEST) || "{}");
        } catch {
            return {};
        }
    })();
    obj[level] = sec;
    localStorage.setItem(LS_MG_BEST, JSON.stringify(obj));
}

function mgRefreshBest() {
    const best = mgGetBest(currentLevel);
    mgBestEl.textContent = best == null ? "—" : mgFormatTime(best);
}

function calculateScore(time, moves, level) {
    const timeBonus = Math.max(0, 5000 - (time * 50));
    const moveBonus = Math.max(0, 3000 - (moves * 100));
    const levelBonus = level * 1000;
    return Math.round((timeBonus + moveBonus + levelBonus) / 100);
}

function showStreakMessage(streak) {
    const messages = [
        "Gut gemacht!",
        "Super!",
        "Fantastisch!",
        "Unglaublich!",
        "Legendär!"
    ];

    const message = streak <= messages.length ? messages[streak - 1] : "PERFEKT!";

    const streakEl = document.createElement('div');
    streakEl.style.position = 'fixed';
    streakEl.style.top = '50%';
    streakEl.style.left = '50%';
    streakEl.style.transform = 'translate(-50%, -50%)';
    streakEl.style.background = 'linear-gradient(135deg, #ffd93d, #ff6b6b)';
    streakEl.style.color = 'white';
    streakEl.style.padding = '20px 40px';
    streakEl.style.borderRadius = '50px';
    streakEl.style.fontSize = '2rem';
    streakEl.style.fontWeight = '900';
    streakEl.style.zIndex = '10000';
    streakEl.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
    streakEl.textContent = `${message} (${streak}x)`;

    document.body.appendChild(streakEl);

    // Animate streak message
    const animation = streakEl.animate([
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
    ], {
        duration: 1500,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });

    animation.onfinish = () => {
        streakEl.remove();
    };
}

// ========= HELPER FUNCTIONS =========
function loadVocabs() {
    try {
        const saved = localStorage.getItem(LS_VOCABS);
        if (saved) {
            const parsed = JSON.parse(saved);
            // 如果没有已保存的单词，返回一些示例数据
            if (parsed.length > 0) {
                return parsed;
            }
        }
        // 返回一些示例单词供测试
        return [
            { id: "1", q: "Haus", a: "house" },
            { id: "2", q: "Auto", a: "car" },
            { id: "3", q: "Hund", a: "dog" },
            { id: "4", q: "Katze", a: "cat" },
            { id: "5", q: "Buch", a: "book" },
            { id: "6", q: "Stuhl", a: "chair" },
            { id: "7", q: "Tisch", a: "table" },
            { id: "8", q: "Fenster", a: "window" },
            { id: "9", q: "Tür", a: "door" },
            { id: "10", q: "Wasser", a: "water" }
        ];
    } catch {
        return [];
    }
}

function randomId() {
    return crypto?.randomUUID?.() || `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ========= INITIALIZATION =========
document.addEventListener("DOMContentLoaded", function () {
    // Set default active level button
    const defaultLevelBtn = document.querySelector('.level-btn-modern[data-level="8"]');
    if (defaultLevelBtn) {
        defaultLevelBtn.classList.add("active");
    }

    // Initial best score display
    mgRefreshBest();

    // Add click sound effects (optional)
    const buttons = document.querySelectorAll('button:not(.no-sound)');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Simple click sound simulation
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (e) {
                // Audio not supported, ignore
            }
        });
    });
});