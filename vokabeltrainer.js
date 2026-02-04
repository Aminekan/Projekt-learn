const LS_KEY = "vokabeltrainer_v2";
const $ = (id) => document.getElementById(id);

let direction = "12";
let timer = null;
let timeLeft = 0;
let current = null;

let vocab = load();

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
function save(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }

function badgeClass(diff) {
  if (diff === "easy") return "easy";
  if (diff === "hard") return "hard";
  return "mid";
}
function badgeText(diff) {
  if (diff === "easy") return "Leicht";
  if (diff === "hard") return "Schwer";
  return "Mittel";
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;","<": "&lt;",">": "&gt;",'"': "&quot;","'": "&#039;"
  }[s]));
}

function filtered() {
  const q = $("search").value.trim().toLowerCase();
  const fb = $("filterBox").value;
  return vocab.filter(v => {
    const hit = (v.s1 + " " + v.s2).toLowerCase().includes(q);
    const boxOk = fb === "all" || String(v.box) === fb;
    return hit && boxOk;
  });
}

function countDue() {
  const now = Date.now();
  return vocab.filter(v => !v.nextAt || v.nextAt <= now).length;
}

function render() {
  const list = $("list");
  const items = filtered();

  $("totalCount").textContent = vocab.length;
  $("shownCount").textContent = items.length;
  $("dueCount").textContent = countDue();

  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = `<div class="msg">Keine Vokabeln gefunden.</div>`;
    return;
  }

  for (const v of items) {
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="left">
        <div class="w1">${escapeHtml(v.s1)}</div>
        <div class="w2">${escapeHtml(v.s2)} · Box ${v.box}</div>
      </div>
      <div style="display:flex; gap:8px; align-items:flex-start;">
        <span class="badge ${badgeClass(v.diff)}">${badgeText(v.diff)}</span>
        <button class="btn" style="padding:8px 10px" title="Löschen" type="button">🗑️</button>
      </div>
    `;

    el.querySelector("button").addEventListener("click", () => {
      vocab = vocab.filter(x => x.id !== v.id);
      save(vocab);
      render();
    });

    list.appendChild(el);
  }
}

// Add vocab
$("saveBtn").addEventListener("click", () => {
  const s1 = $("w1").value.trim();
  const s2 = $("w2").value.trim();
  if (!s1 || !s2) return alert("Bitte Wort und Übersetzung ausfüllen.");

  vocab.unshift({
    id: crypto.randomUUID(),
    s1, s2,
    diff: $("diff").value,
    box: Number($("box").value),
    nextAt: Date.now()
  });

  save(vocab);
  $("w1").value = "";
  $("w2").value = "";
  render();
});

$("clearBtn").addEventListener("click", () => {
  if (confirm("Wirklich ALLE Vokabeln löschen?")) {
    vocab = [];
    save(vocab);
    render();
  }
});

$("demoBtn").addEventListener("click", () => {
  const demo = [
    ["apple","Apfel","easy",1],
    ["to improve","verbessern","mid",1],
    ["reliable","zuverlässig","mid",2],
    ["however","jedoch","hard",1],
    ["achievement","Leistung","hard",2],
  ].map(d => ({
    id: crypto.randomUUID(),
    s1:d[0], s2:d[1], diff:d[2], box:d[3],
    nextAt: Date.now()
  }));
  vocab = demo.concat(vocab);
  save(vocab);
  render();
});

$("search").addEventListener("input", render);
$("filterBox").addEventListener("change", render);

// Theme
$("themeBtn").addEventListener("click", () => {
  const html = document.documentElement;
  const isLight = html.getAttribute("data-theme") === "light";
  html.setAttribute("data-theme", isLight ? "dark" : "light");
});

// Learn UI
function resetResult() {
  const pill = $("resultPill");
  pill.hidden = true;
  pill.className = "resultPill";
  pill.textContent = "—";
}

function showResult(isCorrect, solutionText) {
  const pill = $("resultPill");
  pill.hidden = false;
  pill.className = "resultPill " + (isCorrect ? "ok" : "bad");
  pill.textContent = isCorrect ? "✅ Richtig" : "❌ Falsch";

  if (isCorrect) {
    $("msg").textContent = "Richtig! Sehr gut.";
    $("msg").className = "msg ok";
  } else {
    if ($("examMode").checked) {
      $("msg").textContent = "Falsch. (Prüfungsmodus: Lösung versteckt)";
      $("msg").className = "msg bad";
    } else {
      $("msg").textContent = "Falsch. Lösung: " + solutionText;
      $("msg").className = "msg bad";
    }
  }
}

function setNextAtByBox(v) {
  const days = {1:0, 2:1, 3:3, 4:7, 5:14}[v.box] ?? 0;
  v.nextAt = Date.now() + days*24*60*60*1000;
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
  $("timerTag").textContent = "⏱️ —";
}

function startTimerIfNeeded() {
  const limit = Number($("timeLimit").value);
  if (!limit) { $("timerTag").textContent = "⏱️ —"; return; }

  timeLeft = limit;
  $("timerTag").textContent = "⏱️ " + timeLeft + "s";

  timer = setInterval(() => {
    timeLeft--;
    $("timerTag").textContent = "⏱️ " + timeLeft + "s";
    if (timeLeft <= 0) {
      stopTimer();
      markWrong(true);
    }
  }, 1000);
}

function pickNext() {
  if (!vocab.length) return null;

  const now = Date.now();
  const due = vocab.filter(v => !v.nextAt || v.nextAt <= now);
  const pool = due.length ? due : vocab;

  const weighted = [];
  for (const v of pool) {
    const w = 6 - v.box;
    for (let i=0;i<w;i++) weighted.push(v);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function showQuiz(v) {
  current = v;
  $("quiz").hidden = false;
  $("learnInfo").hidden = true;

  $("msg").textContent = "";
  $("msg").className = "msg";
  $("answer").value = "";
  resetResult();

  const q = (direction === "12") ? v.s1 : v.s2;
  $("question").textContent = "Übersetze: " + q;
  $("qMeta").textContent = `Box ${v.box} · Schwierigkeit ${badgeText(v.diff)}`;
  $("swapBtn").textContent = (direction === "12") ? "Sprache 1 → Sprache 2" : "Sprache 2 → Sprache 1";
}

function nextQuestion() {
  stopTimer();
  const n = pickNext();

  if (!n) {
    $("quiz").hidden = true;
    $("learnInfo").hidden = false;
    $("learnInfo").innerHTML = "Keine Vokabeln vorhanden. Füge zuerst welche hinzu.";
    return;
  }

  showQuiz(n);
  startTimerIfNeeded();
  $("answer").focus();
}

function showSolution() {
  if (!current) return;

  if ($("examMode").checked) {
    $("msg").textContent = "Prüfungsmodus: Lösung ist deaktiviert.";
    $("msg").className = "msg";
    return;
  }

  const solution = (direction === "12") ? current.s2 : current.s1;
  $("msg").textContent = "Lösung: " + solution;
  $("msg").className = "msg";
}

function markRight() {
  if (!current) return;
  const v = vocab.find(x => x.id === current.id);
  if (!v) return;

  v.box = Math.min(5, v.box + 1);
  setNextAtByBox(v);
  save(vocab);
  render();

  setTimeout(nextQuestion, 1200);
}

function markWrong(fromTimeout=false) {
  if (!current) return;
  const v = vocab.find(x => x.id === current.id);
  if (!v) return;

  v.box = Math.max(1, v.box - 1);
  setNextAtByBox(v);
  save(vocab);
  render();

  if (fromTimeout) {
    const solution = (direction === "12") ? current.s2 : current.s1;
    showResult(false, solution);
  }

  setTimeout(nextQuestion, 1200);
}

function checkAnswer() {
  if (!current) return;

  const solution = (direction === "12") ? current.s2 : current.s1;
  const user = $("answer").value.trim().toLowerCase();
  const sol = String(solution).trim().toLowerCase();

  if (!user) return;

  stopTimer();

  const correct = user === sol;
  showResult(correct, solution);

  if (correct) markRight();
  else markWrong();
}

// Controls
$("startBtn").addEventListener("click", nextQuestion);
$("showBtn").addEventListener("click", showSolution);
$("skipBtn").addEventListener("click", () => { stopTimer(); nextQuestion(); });

$("swapBtn").addEventListener("click", () => {
  direction = (direction === "12") ? "21" : "12";
  if (current) showQuiz(current);
});

$("answer").addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkAnswer();
});

// init
render();
