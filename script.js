<<<<<<< HEAD
let form = document.getElementById("Kontaktformular");
let nameInput = document.getElementById("name");
let emailInput = document.getElementById("email");
let messageInput = document.getElementById("message");
let nachricht = document.getElementById("messag");

form.addEventListener("submit", function(event){
    event.preventDefault();
    
    if(nameInput.value === "" || emailInput.value === "" || messageInput.value === ""){
        nachricht.style.color = "Red";
        nachricht.innerText = "Bitte alle Felder ausfüllen ❌";
    }
    else{
        nachricht.style.color = "green";
        nachricht.innerText = "Nachricht wurde gesendet ✅";
        form.reset();
    }

    

});
=======
// ========= LocalStorage =========
const LS_VOCABS = "vocabs_v2";
const LS_STATS  = "stats_v2";

// spaced repetition intervals (days) by box
const BOX_DAYS = [0, 1, 3, 7, 14, 30];

let vocabs = loadVocabs();
let stats  = loadStats();

let current = null;
let timerId = null;
let timeLeft = 0;

// ========= Tabs =========
const navLinks = document.querySelectorAll(".nav a");
const tabs = {
  home: document.getElementById("tab-home"),
  plan: document.getElementById("tab-plan"),
  trainer: document.getElementById("tab-trainer"),
  progress: document.getElementById("tab-progress"),
  minigame: document.getElementById("tab-minigame"),
};

function showTab(name){
  Object.values(tabs).forEach(s => s && (s.style.display = "none"));
  (tabs[name] || tabs.home).style.display = "block";

  navLinks.forEach(a => a.classList.remove("active"));
  const active = document.querySelector(`.nav a[data-tab="${name}"]`);
  if (active) active.classList.add("active");

  if (name === "trainer") renderList();
  if (name === "progress") { updateProgressUI(); drawChart(); }
  if (name !== "trainer") stopTimer();

  if (name === "minigame") mgRefreshBest();
}

navLinks.forEach(a => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    showTab(a.dataset.tab);
  });
});

// ========= Vokabeltrainer =========
const vocabForm = document.getElementById("vocabForm");
const qEl = document.getElementById("q");
const aEl = document.getElementById("a");
const diffEl = document.getElementById("difficulty");
const searchEl = document.getElementById("search");
const vocabListEl = document.getElementById("vocabList");
const vocabCountEl = document.getElementById("vocabCount");
const resetAllBtn = document.getElementById("resetAll");

vocabForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const q = qEl.value.trim();
  const a = aEl.value.trim();
  const difficulty = Number(diffEl.value);

  if (!q || !a) return;

  const now = Date.now();
  vocabs.unshift({
    id: randomId(),
    q, a,
    difficulty,
    box: 1,
    nextReviewAt: now,
    correct: 0,
    wrong: 0,
  });

  saveVocabs();
  vocabForm.reset();
  diffEl.value = "2";

  renderList();
  updateProgressUI();
});

searchEl.addEventListener("input", renderList);

resetAllBtn.addEventListener("click", () => {
  if (!confirm("Wirklich ALLE Vokabeln + Statistik löschen?")) return;
  vocabs = [];
  stats = defaultStats();
  persistAll();
  renderList();
  updateProgressUI();
  drawChart();
  resetLearnUI();
  mgResetUI("Bitte zuerst Vokabeln anlegen (im Vokabeltrainer).");
});

function renderList(){
  const term = (searchEl.value || "").trim().toLowerCase();
  const filtered = vocabs.filter(v =>
    v.q.toLowerCase().includes(term) || v.a.toLowerCase().includes(term)
  );

  vocabListEl.innerHTML = "";

  filtered.forEach(v => {
    const row = document.createElement("div");
    row.style.border = "1px solid #cbd5f5";
    row.style.borderRadius = "10px";
    row.style.padding = "10px";
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.gap = "10px";

    const dueText = (v.nextReviewAt <= Date.now()) ? "FÄLLIG" : `Nächste: ${formatDate(v.nextReviewAt)}`;

    row.innerHTML = `
      <div>
        <div><b>${escapeHtml(v.q)}</b> → ${escapeHtml(v.a)}</div>
        <div style="font-size:12px; color:#334155; margin-top:4px;">
          Schwierigkeit: ${v.difficulty} | Box: ${v.box} | ${dueText}
        </div>
      </div>
      <button data-del="${v.id}">X</button>
    `;

    row.querySelector(`[data-del="${v.id}"]`).addEventListener("click", () => {
      vocabs = vocabs.filter(x => x.id !== v.id);
      saveVocabs();
      renderList();
      updateProgressUI();
      mgResetUI("Vokabel gelöscht. Mini-Game bitte neu starten.");
    });

    vocabListEl.appendChild(row);
  });

  vocabCountEl.textContent = `Angezeigt: ${filtered.length} / Gesamt: ${vocabs.length}`;
}

// ========= Lernmodus =========
const startLearnBtn = document.getElementById("startLearn");
const learnBox = document.getElementById("learnBox");
const questionText = document.getElementById("questionText");
const answerText = document.getElementById("answerText");
const showAnswerBtn = document.getElementById("showAnswer");
const rateButtons = document.getElementById("rateButtons");
const correctBtn = document.getElementById("markCorrect");
const wrongBtn = document.getElementById("markWrong");
const skipBtn = document.getElementById("skip");
const learnInfo = document.getElementById("learnInfo");
const learnMeta = document.getElementById("learnMeta");

// Exam mode
const examModeEl = document.getElementById("examMode");
const examTimeEl = document.getElementById("examTime");
const timerText = document.getElementById("timerText");

startLearnBtn.addEventListener("click", () => {
  if (!vocabs.length){
    alert("Bitte erst Vokabeln anlegen.");
    return;
  }
  learnBox.style.display = "block";
  nextQuestion("Start!");
});

showAnswerBtn.addEventListener("click", () => {
  answerText.style.display = "block";
  rateButtons.style.display = "block";
  showAnswerBtn.disabled = true;
});

correctBtn.addEventListener("click", () => grade(true));
wrongBtn.addEventListener("click", () => grade(false));
skipBtn.addEventListener("click", () => nextQuestion("Übersprungen."));

function nextQuestion(msg){
  stopTimer();

  const now = Date.now();
  const due = vocabs.filter(v => v.nextReviewAt <= now);

  current = due.length
    ? due.sort((a,b)=>a.nextReviewAt-b.nextReviewAt)[0]
    : weightedRandomByDifficulty(vocabs);

  questionText.textContent = current.q;
  answerText.textContent = current.a;

  answerText.style.display = "none";
  rateButtons.style.display = "none";
  showAnswerBtn.disabled = false;

  learnMeta.textContent =
    `Schwierigkeit: ${current.difficulty} | Box: ${current.box} | Fällig: ${current.nextReviewAt <= now ? "Ja" : "Nein"}`;

  learnInfo.textContent = msg || "";

  const seconds = Number(examTimeEl.value);
  if (examModeEl.checked && seconds > 0){
    timeLeft = seconds;
    timerText.textContent = `⏱️ ${timeLeft}s`;
    timerId = setInterval(() => {
      timeLeft--;
      timerText.textContent = `⏱️ ${timeLeft}s`;
      if (timeLeft <= 0){
        stopTimer();
        grade(false, true); // timeout => wrong
      }
    }, 1000);
  } else {
    timerText.textContent = "⏱️ —";
  }
}

function grade(isCorrect, isTimeout=false){
  stats.answered += 1;

  const day = todayKey();
  stats.history[day] = stats.history[day] || { c:0, w:0 };

  if (isCorrect){
    stats.correct += 1;
    stats.history[day].c += 1;
    current.correct += 1;
    current.box = Math.min(5, current.box + 1);
  } else {
    stats.wrong += 1;
    stats.history[day].w += 1;
    current.wrong += 1;
    current.box = Math.max(1, current.box - 1);
  }

  const now = Date.now();
  const days = BOX_DAYS[current.box] ?? 1;
  current.nextReviewAt = now + days * 24 * 60 * 60 * 1000;

  persistAll();
  updateProgressUI();
  renderList();

  nextQuestion(isTimeout ? "Zeit abgelaufen → Falsch." : (isCorrect ? "✅ Richtig!" : "❌ Falsch!"));
}

function resetLearnUI(){
  stopTimer();
  timerText.textContent = "⏱️ —";
  learnBox.style.display = "none";
  current = null;
  learnInfo.textContent = "";
}

function stopTimer(){
  if (timerId){ clearInterval(timerId); timerId = null; }
}

// ========= Learnfortschritt (Stats + Chart) =========
const statTotal = document.getElementById("statTotal");
const statAnswered = document.getElementById("statAnswered");
const statCorrect = document.getElementById("statCorrect");
const statWrong = document.getElementById("statWrong");
const statAccuracy = document.getElementById("statAccuracy");
const statDue = document.getElementById("statDue");

const refreshChartBtn = document.getElementById("refreshChart");
const chart = document.getElementById("chart");
const ctx = chart.getContext("2d");

refreshChartBtn.addEventListener("click", () => { updateProgressUI(); drawChart(); });

function updateProgressUI(){
  statTotal.textContent = String(vocabs.length);
  statAnswered.textContent = String(stats.answered);
  statCorrect.textContent = String(stats.correct);
  statWrong.textContent = String(stats.wrong);
  statAccuracy.textContent = stats.answered ? `${Math.round((stats.correct / stats.answered) * 100)}%` : "0%";
  const now = Date.now();
  statDue.textContent = String(vocabs.filter(v => v.nextReviewAt <= now).length);
}

function drawChart(){
  ctx.clearRect(0,0,chart.width,chart.height);

  const days = lastNDays(7);
  const data = days.map(d => stats.history[d.key] || {c:0,w:0});
  const maxVal = Math.max(1, ...data.map(x => x.c + x.w));

  const pad = 30;
  const w = chart.width - pad*2;
  const h = chart.height - pad*2;
  const group = w / days.length;

  ctx.strokeStyle = "#cbd5f5";
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, pad + h);
  ctx.lineTo(pad + w, pad + h);
  ctx.stroke();

  days.forEach((d,i) => {
    const x = pad + i*group + group/2;
    const cH = (data[i].c / maxVal) * h;
    const wH = (data[i].w / maxVal) * h;

    ctx.fillStyle = "#16a34a";
    ctx.fillRect(x - 18, pad + (h - cH), 14, cH);

    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(x + 4, pad + (h - wH), 14, wH);

    ctx.fillStyle = "#334155";
    ctx.font = "12px Arial";
    ctx.fillText(d.label, x - 16, pad + h + 18);
  });
}

// ========= MINI-GAME: Vocabulary Memory Match =========
const mgLevelEl = document.getElementById("mgLevel");
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

const LS_MG_BEST = "minigame_best_v1";

let mgCards = [];
let mgFirst = null;
let mgSecond = null;
let mgLock = false;

let mgMoves = 0;
let mgMatches = 0;
let mgTimer = null;
let mgSeconds = 0;
let mgRunning = false;

mgStartBtn.addEventListener("click", mgStart);
mgPlayAgainBtn.addEventListener("click", mgStart);

function mgResetUI(message=""){
  mgBoard.innerHTML = "";
  mgInfo.textContent = message;
  mgWin.style.display = "none";
  mgMoves = 0;
  mgMatches = 0;
  mgSeconds = 0;
  mgRunning = false;
  mgFirst = null;
  mgSecond = null;
  mgLock = false;
  mgMovesEl.textContent = "0";
  mgMatchesEl.textContent = "0";
  mgTimeEl.textContent = "00:00";
  mgStopTimer();
  mgRefreshBest();
}

function mgStart(){
  vocabs = loadVocabs(); // refresh latest vocabs
  if (!vocabs.length){
    mgResetUI("Bitte zuerst Vokabeln anlegen (im Vokabeltrainer).");
    return;
  }

  mgWin.style.display = "none";
  mgInfo.textContent = "Merke dir die Karten und finde die Paare!";
  mgMoves = 0;
  mgMatches = 0;
  mgSeconds = 0;
  mgMovesEl.textContent = "0";
  mgMatchesEl.textContent = "0";
  mgTimeEl.textContent = "00:00";
  mgStopTimer();

  mgFirst = null;
  mgSecond = null;
  mgLock = false;
  mgRunning = true;

  const pairs = Number(mgLevelEl.value); // 6/8/10
  const pool = shuffle([...vocabs]).slice(0, Math.min(pairs, vocabs.length));

  // Build cards: one "q" card + one "a" card per vocab
  mgCards = [];
  pool.forEach(v => {
    mgCards.push({ id: randomId(), pairId: v.id, type: "Wort", text: v.q, matched:false });
    mgCards.push({ id: randomId(), pairId: v.id, type: "Übersetzung", text: v.a, matched:false });
  });

  mgCards = shuffle(mgCards);

  mgRenderBoard(mgCards);

  // Quick "preview" (2 seconds), then hide
  setTimeout(() => {
    document.querySelectorAll(".card").forEach(c => c.classList.add("hidden"));
    mgStartTimer();
  }, 900);
}

function mgRenderBoard(cards){
  mgBoard.innerHTML = "";
  cards.forEach(card => {
    const el = document.createElement("div");
    el.className = "card";
    el.dataset.id = card.id;

    el.innerHTML = `
      <div class="cardInner">
        <div class="cardFace">${escapeHtml(card.text)}</div>
        <div class="cardType">${escapeHtml(card.type)}</div>
      </div>
    `;

    // start visible (preview), will hide after timeout
    el.addEventListener("click", () => mgFlip(card.id));

    mgBoard.appendChild(el);
  });
}

function mgFlip(cardId){
  if (!mgRunning) return;
  if (mgLock) return;

  const card = mgCards.find(c => c.id === cardId);
  if (!card || card.matched) return;

  const el = mgGetCardEl(cardId);
  if (!el || !el.classList.contains("hidden")) {
    // already visible
    return;
  }

  // reveal
  el.classList.remove("hidden");

  if (!mgFirst){
    mgFirst = card;
    return;
  }

  if (mgFirst.id === card.id) return;

  mgSecond = card;
  mgMoves++;
  mgMovesEl.textContent = String(mgMoves);

  // check match: same pairId but different type
  const isMatch = (mgFirst.pairId === mgSecond.pairId) && (mgFirst.type !== mgSecond.type);

  if (isMatch){
    card.matched = true;
    mgFirst.matched = true;

    mgGetCardEl(mgFirst.id)?.classList.add("matched");
    mgGetCardEl(mgSecond.id)?.classList.add("matched");

    mgMatches++;
    mgMatchesEl.textContent = String(mgMatches);

    mgFirst = null;
    mgSecond = null;

    if (mgMatches === mgCards.length / 2){
      mgWinGame();
    }
  } else {
    mgLock = true;
    mgGetCardEl(mgFirst.id)?.classList.add("wrongFlash");
    mgGetCardEl(mgSecond.id)?.classList.add("wrongFlash");

    setTimeout(() => {
      mgGetCardEl(mgFirst.id)?.classList.add("hidden");
      mgGetCardEl(mgSecond.id)?.classList.add("hidden");
      mgFirst = null;
      mgSecond = null;
      mgLock = false;
    }, 800);
  }
}

function mgWinGame(){
  mgRunning = false;
  mgStopTimer();

  const timeStr = mgFormatTime(mgSeconds);
  mgWin.style.display = "block";
  mgWinText.textContent = `Zeit: ${timeStr} | Züge: ${mgMoves}`;

  // Best time logic (per level)
  const level = Number(mgLevelEl.value);
  const best = mgGetBest(level);
  if (best == null || mgSeconds < best){
    mgSetBest(level, mgSeconds);
    mgRefreshBest();
    mgInfo.textContent = "🏆 Neue Bestzeit!";
  } else {
    mgInfo.textContent = "✅ Stark! Versuche deine Bestzeit zu schlagen.";
  }
}

function mgGetCardEl(id){
  return mgBoard.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
}

function mgStartTimer(){
  mgStopTimer();
  mgTimer = setInterval(() => {
    mgSeconds++;
    mgTimeEl.textContent = mgFormatTime(mgSeconds);
  }, 1000);
}

function mgStopTimer(){
  if (mgTimer){ clearInterval(mgTimer); mgTimer = null; }
}

function mgFormatTime(sec){
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function mgGetBest(level){
  try{
    const obj = JSON.parse(localStorage.getItem(LS_MG_BEST) || "{}");
    return (typeof obj[level] === "number") ? obj[level] : null;
  } catch {
    return null;
  }
}

function mgSetBest(level, sec){
  const obj = (() => {
    try { return JSON.parse(localStorage.getItem(LS_MG_BEST) || "{}"); }
    catch { return {}; }
  })();
  obj[level] = sec;
  localStorage.setItem(LS_MG_BEST, JSON.stringify(obj));
}

function mgRefreshBest(){
  const level = Number(mgLevelEl.value || 8);
  const best = mgGetBest(level);
  mgBestEl.textContent = best == null ? "—" : mgFormatTime(best);
}

// ========= Helpers =========
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function weightedRandomByDifficulty(arr){
  const bag = [];
  for (const v of arr){
    const w = v.difficulty === 3 ? 3 : (v.difficulty === 2 ? 2 : 1);
    for (let i=0;i<w;i++) bag.push(v);
  }
  return bag[Math.floor(Math.random() * bag.length)];
}

function defaultStats(){ return { answered:0, correct:0, wrong:0, history:{} }; }

function loadVocabs(){ try { return JSON.parse(localStorage.getItem(LS_VOCABS)) || []; } catch { return []; } }
function saveVocabs(){ localStorage.setItem(LS_VOCABS, JSON.stringify(vocabs)); }

function loadStats(){ try { return JSON.parse(localStorage.getItem(LS_STATS)) || defaultStats(); } catch { return defaultStats(); } }
function saveStats(){ localStorage.setItem(LS_STATS, JSON.stringify(stats)); }

function persistAll(){ saveVocabs(); saveStats(); }

function randomId(){ return (crypto?.randomUUID?.() || `id_${Math.random().toString(16).slice(2)}_${Date.now()}`); }
function escapeHtml(str){ return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

function formatDate(ts){
  const d=new Date(ts);
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
}

function todayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function lastNDays(n){
  const out=[];
  for (let i=n-1;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    out.push({
      key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
      label:`${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`
    });
  }
  return out;
}

// ========= Init =========
renderList();
updateProgressUI();
drawChart();
mgResetUI("Starte das Spiel, nachdem du Vokabeln angelegt hast.");
showTab("home");
>>>>>>> 8e5c0837f9b4c54eacce1091a375b9a5505613d0
