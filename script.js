// ========= STORAGE KEYS =========
const VOCAB_STORAGE_KEY = "meine_vokabeln";
const STATS_STORAGE_KEY = "lern_stats";

// ========= VOCAB PANEL ELEMENTS =========
const wordQ = document.getElementById("wordQ");
const wordA = document.getElementById("wordA");
const wordCategory = document.getElementById("wordCategory");
const saveBtn = document.getElementById("saveVocabBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const searchInput = document.getElementById("searchInput");
const vocabListContainer = document.getElementById("vocabListContainer");
const vocabCounter = document.getElementById("vocabCounter");
const difficultySelect = document.getElementById("difficultySelect");
const filterBtns = document.querySelectorAll(".filter-btn");

// ========= MEMORY ELEMENTS =========
const memoryBoard = document.getElementById("memoryBoard");
const timerDisplay = document.getElementById("timerDisplay");
const movesDisplay = document.getElementById("movesDisplay");
const matchesDisplay = document.getElementById("matchesDisplay");
const bestTimeDisplay = document.getElementById("bestTimeDisplay");
const gameInfo = document.getElementById("gameInfo");
const progressBar = document.getElementById("progressBar");
const winMessage = document.getElementById("winMessage");
const memoryStartBtn = document.getElementById("memoryStartBtn");
const difficultyBtns = document.querySelectorAll(".tab-btn");
const progressPercent = document.getElementById("progressPercent");

// ========= STATS ELEMENTS =========
const learnedCount = document.getElementById("learnedCount");
const totalTime = document.getElementById("totalTime");
const streakCount = document.getElementById("streakCount");
const totalLearned = document.getElementById("totalLearned");
const successRate = document.getElementById("successRate");
const bestStreak = document.getElementById("bestStreak");
const challengeNovice = document.getElementById("challengeNovice");
const challengeExpert = document.getElementById("challengeExpert");
const challengeMaster = document.getElementById("challengeMaster");
const dailyCount = document.getElementById("dailyCount");
const dailyStreak = document.getElementById("dailyStreak");
const dailyFill = document.getElementById("dailyFill");
const extraTabs = document.querySelectorAll(".extra-tab");
const extraContents = document.querySelectorAll(".extra-content");
const statsChartCanvas = document.getElementById("statsChart");

// ========= GAME VARIABLES =========
let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;
let seconds = 0;
let timer = null;
let gameActive = false;
let currentLevel = 6;
let currentDifficulty = 1;
let currentFilter = "all";
let statsChart = null;

// ========= STATS VARIABLES =========
let stats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalMoves: 0,
    totalTime: 0,
    learnedVocabs: [],
    dailyGoal: 10,
    dailyProgress: 0,
    lastPlayed: null,
    streak: 0,
    bestStreak: 0,
    challenges: {
        novice: 0,
        expert: 0,
        master: 0
    },
    weeklyData: [0, 0, 0, 0, 0, 0, 0]
};

// ========= FUNCTIONS DE BASE =========
function getVocabs() {
    const data = localStorage.getItem(VOCAB_STORAGE_KEY);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveVocabs(vocabs) {
    localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(vocabs));
    return true;
}

function getStats() {
    const data = localStorage.getItem(STATS_STORAGE_KEY);
    if (data) {
        try {
            const parsedStats = JSON.parse(data);
            return { ...stats, ...parsedStats };
        } catch (e) {
            return stats;
        }
    }
    return stats;
}

function saveStats(newStats) {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    stats = newStats;
    updateStatsDisplay();
    updateChart();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========= RENDER VOCAB LIST =========
function renderVocabList(searchTerm = "") {
    const vocabs = getVocabs();
    
    let filtered = vocabs;
    
    if (currentFilter !== "all") {
        filtered = filtered.filter(v => v.difficulty === parseInt(currentFilter));
    }
    
    if (searchTerm) {
        filtered = filtered.filter(v => 
            v.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.category && v.category.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    vocabListContainer.innerHTML = "";
    
    if (filtered.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "vocab-item";
        emptyDiv.style.color = "#94a3b8";
        emptyDiv.style.justifyContent = "center";
        emptyDiv.textContent = "Keine Vokabeln vorhanden";
        vocabListContainer.appendChild(emptyDiv);
    } else {
        filtered.forEach((v, index) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "vocab-item";
            
            let difficultyText = "Mittel";
            let difficultyColor = "#fbbf24";
            if (v.difficulty === 1) {
                difficultyText = "Leicht";
                difficultyColor = "#4ade80";
            }
            if (v.difficulty === 3) {
                difficultyText = "Schwer";
                difficultyColor = "#f87171";
            }
            
            const categoryText = v.category ? ` · ${v.category}` : '';
            
            itemDiv.innerHTML = `
                <div style="flex:1">
                    <strong>${escapeHtml(v.q)} → ${escapeHtml(v.a)}</strong>
                    <div class="vocab-meta">
                        <i class="fas fa-signal" style="color: ${difficultyColor}"></i> ${difficultyText}
                        ${categoryText}
                        ${v.learned ? ' · <i class="fas fa-check-circle" style="color:#4ade80"></i> Gelernt' : ''}
                    </div>
                </div>
                <button class="delete-single" data-index="${index}" style="background:none; border:none; color:#f56565; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            vocabListContainer.appendChild(itemDiv);
        });
        
        document.querySelectorAll(".delete-single").forEach(btn => {
            btn.addEventListener("click", function(e) {
                e.stopPropagation();
                const index = this.getAttribute("data-index");
                deleteVocab(parseInt(index));
            });
        });
    }
    
    vocabCounter.textContent = `Angezeigt: ${filtered.length} / Gesamt: ${vocabs.length}`;
}

function deleteVocab(index) {
    const vocabs = getVocabs();
    if (index >= 0 && index < vocabs.length) {
        vocabs.splice(index, 1);
        saveVocabs(vocabs);
        renderVocabList(searchInput.value);
    }
}

// ========= SAVE BUTTON =========
saveBtn.addEventListener("click", function() {
    const q = wordQ.value.trim();
    const a = wordA.value.trim();
    const category = wordCategory.value.trim();
    
    if (!q || !a) {
        alert("Bitte Wort und Übersetzung eingeben!");
        return;
    }
    
    let difficultyValue = 2;
    if (difficultySelect.value === "Leicht") difficultyValue = 1;
    if (difficultySelect.value === "Mittel") difficultyValue = 2;
    if (difficultySelect.value === "Schwer") difficultyValue = 3;
    
    const vocabs = getVocabs();
    
    const newVocab = {
        id: Date.now() + Math.random(),
        q: q,
        a: a,
        category: category || "Allgemein",
        difficulty: difficultyValue,
        box: 1,
        faellig: true,
        learned: false,
        timesCorrect: 0,
        timesWrong: 0
    };
    
    vocabs.push(newVocab);
    saveVocabs(vocabs);
    
    wordQ.value = "";
    wordA.value = "";
    wordCategory.value = "";
    renderVocabList(searchInput.value);
});

// ========= DELETE ALL =========
deleteAllBtn.addEventListener("click", () => {
    if (confirm("Alle Vokabeln löschen?")) {
        localStorage.removeItem(VOCAB_STORAGE_KEY);
        renderVocabList("");
    }
});

// ========= SEARCH =========
searchInput.addEventListener("input", (e) => {
    renderVocabList(e.target.value);
});

// ========= FILTER BUTTONS =========
filterBtns.forEach(btn => {
    btn.addEventListener("click", function() {
        filterBtns.forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        currentFilter = this.dataset.filter;
        renderVocabList(searchInput.value);
    });
});

// ========= EXTRA TABS =========
extraTabs.forEach(tab => {
    tab.addEventListener("click", function() {
        extraTabs.forEach(t => t.classList.remove("active"));
        extraContents.forEach(c => c.classList.remove("active"));
        
        this.classList.add("active");
        const tabId = this.dataset.tab;
        const targetTab = document.getElementById(tabId + "Tab");
        if (targetTab) {
            targetTab.classList.add("active");
            if (tabId === "stats") {
                setTimeout(() => updateChart(), 100);
            }
        }
    });
});

// ========= MEMORY FUNCTIONS =========
difficultyBtns.forEach(btn => {
    btn.addEventListener("click", function() {
        difficultyBtns.forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        currentLevel = parseInt(this.dataset.level);
        
        const btnText = this.querySelector("span").textContent;
        if (btnText === "Leicht") currentDifficulty = 1;
        else if (btnText === "Mittel") currentDifficulty = 2;
        else if (btnText === "Schwer") currentDifficulty = 3;
    });
});

memoryStartBtn.addEventListener("click", startGame);

function startGame() {
    const alleVocabs = getVocabs();
    
    const gefilterteVocabs = alleVocabs.filter(v => v.difficulty === currentDifficulty);
    
    if (gefilterteVocabs.length < currentLevel) {
        gameInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>Nicht genug Vokabeln für dieses Level! (${gefilterteVocabs.length}/${currentLevel})</span>`;
        return;
    }
    
    cards = [];
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    moves = 0;
    matches = 0;
    seconds = 0;
    gameActive = true;
    
    movesDisplay.textContent = moves;
    matchesDisplay.textContent = matches;
    timerDisplay.textContent = formatTime(seconds);
    progressBar.style.width = "0%";
    if (progressPercent) progressPercent.textContent = "0%";
    winMessage.style.display = "none";
    
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        seconds++;
        timerDisplay.textContent = formatTime(seconds);
    }, 1000);
    
    const shuffled = [...gefilterteVocabs].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, currentLevel);
    
    cards = [];
    selected.forEach(v => {
        cards.push({ id: v.id, text: v.q, matched: false, vocab: v });
        cards.push({ id: v.id, text: v.a, matched: false, vocab: v });
    });
    
    cards.sort(() => Math.random() - 0.5);
    
    renderBoard();
    gameInfo.innerHTML = `<i class="fas fa-play"></i><span>Spiel gestartet mit ${currentLevel} ${getDifficultyName(currentDifficulty)}-Paaren!</span>`;
}

function getDifficultyName(diff) {
    if (diff === 1) return "Leicht";
    if (diff === 2) return "Mittel";
    return "Schwer";
}

function renderBoard() {
    memoryBoard.innerHTML = "";
    const cols = Math.min(4, Math.ceil(Math.sqrt(cards.length)));
    memoryBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    cards.forEach((card, index) => {
        const cardEl = document.createElement("div");
        cardEl.className = "memory-card";
        cardEl.dataset.index = index;
        
        cardEl.addEventListener("click", function() {
            flipCard(index);
        });
        
        memoryBoard.appendChild(cardEl);
    });
}

// ========= CORE GAME FUNCTION - FLIP CARD =========
function flipCard(index) {
    if (!gameActive || lockBoard) return;
    
    const card = cards[index];
    const cardEl = memoryBoard.children[index];
    
    if (card.matched || cardEl.classList.contains("flipped")) return;
    
    cardEl.textContent = card.text;
    cardEl.classList.add("flipped");
    
    if (!firstCard) {
        firstCard = { index, el: cardEl, data: card };
        return;
    }
    
    if (firstCard.index === index) return;
    
    secondCard = { index, el: cardEl, data: card };
    lockBoard = true;
    moves++;
    movesDisplay.textContent = moves;
    
    if (firstCard.data.id === secondCard.data.id) {
        if (typeof confetti === 'function') {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    confetti({
                        particleCount: 10,
                        spread: 45,
                        origin: { 
                            x: Math.random(), 
                            y: Math.random() * 0.5 
                        }
                    });
                }, i * 50);
            }
        }
        
        card.matched = true;
        cards[firstCard.index].matched = true;
        
        firstCard.el.classList.add("matched");
        secondCard.el.classList.add("matched");
        
        matches++;
        matchesDisplay.textContent = matches;
        
        const progress = Math.round((matches / (cards.length / 2)) * 100);
        progressBar.style.width = `${progress}%`;
        if (progressPercent) progressPercent.textContent = progress + '%';
        
        const vocab = card.vocab;
        const allVocabs = getVocabs();
        const vocabIndex = allVocabs.findIndex(v => v.id === vocab.id);
        if (vocabIndex !== -1) {
            allVocabs[vocabIndex].timesCorrect = (allVocabs[vocabIndex].timesCorrect || 0) + 1;
            if (allVocabs[vocabIndex].timesCorrect >= 3) {
                allVocabs[vocabIndex].learned = true;
            }
            saveVocabs(allVocabs);
        }
        
        firstCard = null;
        secondCard = null;
        lockBoard = false;
        
        checkWin();
    } else {
        setTimeout(() => {
            firstCard.el.classList.remove("flipped");
            secondCard.el.classList.remove("flipped");
            firstCard.el.textContent = "";
            secondCard.el.textContent = "";
            firstCard = null;
            secondCard = null;
            lockBoard = false;
        }, 800);
    }
}

function checkWin() {
    const allMatched = cards.every(c => c.matched);
    if (allMatched) {
        gameActive = false;
        clearInterval(timer);
        
        console.log("🎉 GEWONNEN! Statistiken werden aktualisiert...");
        
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
            });
        }
        
        winMessage.style.display = "block";
        winMessage.innerHTML = `
            <i class="fas fa-trophy"></i>
            <h3>HERZLICHEN GLÜCKWUNSCH!</h3>
            <p>Zeit: ${formatTime(seconds)} | Züge: ${moves}</p>
        `;
        
        gameInfo.innerHTML = `<i class="fas fa-check-circle"></i><span>Spiel beendet! Du hast gewonnen! 🎉</span>`;
        
        // تحديث الإحصائيات
        updateStatsAfterWin();
    }
}

function updateStatsAfterWin() {
    console.log("📊 updateStatsAfterWin() wird ausgeführt...");
    
    const currentStats = getStats();
    console.log("Aktuelle Stats vor Update:", currentStats);
    
    // زيادة عدد الألعاب
    currentStats.gamesPlayed = (currentStats.gamesPlayed || 0) + 1;
    currentStats.gamesWon = (currentStats.gamesWon || 0) + 1;
    currentStats.totalMoves = (currentStats.totalMoves || 0) + moves;
    currentStats.totalTime = (currentStats.totalTime || 0) + seconds;
    
    console.log("Nach Spielzählung:", {
        gamesPlayed: currentStats.gamesPlayed,
        gamesWon: currentStats.gamesWon
    });
    
    // زيادة التقدم اليومي
    currentStats.dailyProgress = (currentStats.dailyProgress || 0) + 1;
    
    // تحديث بيانات الأسبوع
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    
    if (!currentStats.weeklyData) {
        currentStats.weeklyData = [0, 0, 0, 0, 0, 0, 0];
    }
    currentStats.weeklyData[dayIndex] = (currentStats.weeklyData[dayIndex] || 0) + 1;
    
    // تحديث التحديات
    if (!currentStats.challenges) {
        currentStats.challenges = { novice: 0, expert: 0, master: 0 };
    }
    currentStats.challenges.novice = (currentStats.challenges.novice || 0) + 1;
    currentStats.challenges.expert = (currentStats.challenges.expert || 0) + 1;
    currentStats.challenges.master = (currentStats.challenges.master || 0) + 1;
    
    // تحديث streak
    const todayStr = new Date().toDateString();
    if (currentStats.lastPlayed !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (currentStats.lastPlayed === yesterday.toDateString()) {
            currentStats.streak = (currentStats.streak || 0) + 1;
        } else {
            currentStats.streak = 1;
        }
        
        if ((currentStats.streak || 0) > (currentStats.bestStreak || 0)) {
            currentStats.bestStreak = currentStats.streak;
        }
        
        currentStats.lastPlayed = todayStr;
    }
    
    console.log("Stats nach Update (vor save):", currentStats);
    
    // حفظ الإحصائيات
    saveStats(currentStats);
    
    // تحديث العرض
    renderVocabList(searchInput.value);
    
    console.log("✅ Statistiken gespeichert!");
}

function updateStatsDisplay() {
    console.log("📊 updateStatsDisplay() wird ausgeführt...");
    
    const currentStats = getStats();
    const vocabs = getVocabs();
    
    const learned = vocabs.filter(v => v.learned).length;
    
    if (learnedCount) learnedCount.textContent = learned;
    if (totalLearned) totalLearned.textContent = learned;
    
    const totalMinutes = Math.floor((currentStats.totalTime || 0) / 60);
    if (totalTime) totalTime.textContent = totalMinutes;
    
    if (streakCount) streakCount.textContent = currentStats.streak || 0;
    if (dailyStreak) dailyStreak.textContent = currentStats.streak || 0;
    if (bestStreak) bestStreak.textContent = currentStats.bestStreak || 0;
    
    // حساب نسبة النجاح
    const gamesPlayed = currentStats.gamesPlayed || 0;
    const gamesWon = currentStats.gamesWon || 0;
    const rate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
    
    console.log("Erfolgsquote Berechnung:", {
        gamesPlayed,
        gamesWon,
        rate
    });
    
    if (successRate) {
        successRate.textContent = rate + '%';
    }
    
    if (challengeNovice) challengeNovice.textContent = `${currentStats.challenges?.novice || 0}/10`;
    if (challengeExpert) challengeExpert.textContent = `${currentStats.challenges?.expert || 0}/50`;
    if (challengeMaster) challengeMaster.textContent = `${currentStats.challenges?.master || 0}/100`;
    
    const noviceFill = document.querySelector('[data-challenge="novice"] .challenge-fill');
    const expertFill = document.querySelector('[data-challenge="expert"] .challenge-fill');
    const masterFill = document.querySelector('[data-challenge="master"] .challenge-fill');
    
    if (noviceFill) noviceFill.style.width = Math.min(100, ((currentStats.challenges?.novice || 0) / 10) * 100) + '%';
    if (expertFill) expertFill.style.width = Math.min(100, ((currentStats.challenges?.expert || 0) / 50) * 100) + '%';
    if (masterFill) masterFill.style.width = Math.min(100, ((currentStats.challenges?.master || 0) / 100) * 100) + '%';
    
    const dailyProgress = currentStats.dailyProgress || 0;
    const dailyTarget = currentStats.dailyGoal || 10;
    if (dailyCount) dailyCount.textContent = `${dailyProgress}/${dailyTarget}`;
    if (dailyFill) dailyFill.style.width = Math.min(100, (dailyProgress / dailyTarget) * 100) + '%';
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ========= CHART FUNCTION =========
function updateChart() {
    if (!statsChartCanvas) {
        console.log("Chart Canvas nicht gefunden");
        return;
    }
    
    const currentStats = getStats();
    const weeklyData = currentStats.weeklyData || [0, 0, 0, 0, 0, 0, 0];
    const maxValue = Math.max(...weeklyData, 1);
    
    if (statsChart) {
        statsChart.destroy();
    }
    
    try {
        const ctx = statsChartCanvas.getContext('2d');
        
        statsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
                datasets: [{
                    label: 'Gelernte Vokabeln',
                    data: weeklyData,
                    borderColor: '#2dd4bf',
                    backgroundColor: 'rgba(45, 212, 191, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#2dd4bf',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxValue + 1,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 1,
                            callback: function(value) {
                                if (Number.isInteger(value)) {
                                    return value;
                                }
                                return null;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
        
        console.log("Chart aktualisiert:", weeklyData);
    } catch (e) {
        console.log("Chart Fehler:", e);
    }
}

// ========= RESET STATS FUNKTION =========
function resetStats() {
    if (confirm("Alle Statistiken zurücksetzen?")) {
        const newStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalMoves: 0,
            totalTime: 0,
            learnedVocabs: [],
            dailyGoal: 10,
            dailyProgress: 0,
            lastPlayed: new Date().toDateString(),
            streak: 0,
            bestStreak: 0,
            challenges: {
                novice: 0,
                expert: 0,
                master: 0
            },
            weeklyData: [0, 0, 0, 0, 0, 0, 0]
        };
        saveStats(newStats);
        console.log("Statistiken zurückgesetzt!");
    }
}

// ========= TEST FUNKTION =========
function testStats() {
    console.log("🧪 Testdaten werden geladen...");
    const currentStats = getStats();
    currentStats.gamesPlayed = 5;
    currentStats.gamesWon = 4;
    currentStats.dailyProgress = 3;
    currentStats.weeklyData = [2, 3, 1, 4, 2, 3, 1];
    currentStats.challenges = { novice: 3, expert: 1, master: 0 };
    currentStats.streak = 2;
    currentStats.bestStreak = 3;
    saveStats(currentStats);
    console.log("✅ Testdaten geladen!");
}

// ========= INIT =========
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM geladen - Initialisiere Lernplattform");
    
    let alleVokabeln = getVocabs();
    
    if (alleVokabeln.length === 0) {
        alleVokabeln = [
            { id: "l1", q: "Hund", a: "dog", category: "Tiere", difficulty: 1, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "l2", q: "Katze", a: "cat", category: "Tiere", difficulty: 1, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "l3", q: "Haus", a: "house", category: "Wohnen", difficulty: 1, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "l4", q: "Auto", a: "car", category: "Verkehr", difficulty: 1, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "l5", q: "Buch", a: "book", category: "Schule", difficulty: 1, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "l6", q: "Tisch", a: "table", category: "Wohnen", difficulty: 1, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "m1", q: "verstehen", a: "to understand", category: "Verben", difficulty: 2, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "m2", q: "erinnern", a: "to remember", category: "Verben", difficulty: 2, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "m3", q: "vergessen", a: "to forget", category: "Verben", difficulty: 2, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "m4", q: "glauben", a: "to believe", category: "Verben", difficulty: 2, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "m5", q: "hoffen", a: "to hope", category: "Verben", difficulty: 2, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "m6", q: "warten", a: "to wait", category: "Verben", difficulty: 2, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "m7", q: "brauchen", a: "to need", category: "Verben", difficulty: 2, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "m8", q: "kaufen", a: "to buy", category: "Verben", difficulty: 2, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s1", q: "beeindrucken", a: "to impress", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s2", q: "unterstützen", a: "to support", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s3", q: "widersprechen", a: "to contradict", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s4", q: "verhandeln", a: "to negotiate", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s5", q: "überzeugen", a: "to convince", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s6", q: "beschließen", a: "to decide", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s7", q: "vermeiden", a: "to avoid", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s8", q: "erlauben", a: "to allow", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s9", q: "verbieten", a: "to forbid", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 },
            { id: "s10", q: "empfehlen", a: "to recommend", category: "Fortgeschritten", difficulty: 3, box: 1, faellig: true, learned: false, timesCorrect: 0, timesWrong: 0 }
        ];
        
        saveVocabs(alleVokabeln);
    }
    
    const initialStats = getStats();
    if (!initialStats.lastPlayed) {
        initialStats.lastPlayed = new Date().toDateString();
        initialStats.dailyProgress = 0;
        initialStats.streak = 0;
        initialStats.bestStreak = 0;
        initialStats.gamesPlayed = 0;
        initialStats.gamesWon = 0;
        initialStats.totalMoves = 0;
        initialStats.totalTime = 0;
        initialStats.weeklyData = [0, 0, 0, 0, 0, 0, 0];
        initialStats.challenges = { novice: 0, expert: 0, master: 0 };
        saveStats(initialStats);
    }
    
    renderVocabList("");
    updateStatsDisplay();
    
    setTimeout(() => {
        updateChart();
    }, 500);
    
    // يمكنك استخدام هاد الدوال في Console للتجربة:
    window.testStats = testStats;
    window.resetStats = resetStats;
    
    console.log("Lernplattform bereit!");
    console.log("Zum Testen: testStats() oder resetStats() in der Console eingeben");
});