/* ─── Emoji Pool ─── */
var em = ["🚀", "🛸", "🪐", "🌙", "⭐", "🛰️", "🌠", "🔭", "💫", "☄️", "🌟", "🌍", "🌕", "👾", "🤖", "🔮", "🪨", "🌌", "🎆", "🌀"];

/* Shuffle Engine */
function shuffleArray(arr) {
  var t, c, p = arr.length;
  if (p) while (--p) { c = Math.floor(Math.random() * (p + 1)); t = arr[c]; arr[c] = arr[p]; arr[p] = t; }
}
shuffleArray(em);

/* ─── Application States ─── */
var pre = "", pID, ppID = 0, turn = 0;
var t_prop = "transform", flip = "rotateY(180deg)", flipBack = "rotateY(0deg)";
var gameTimer, min = 0, sec = 0, moves = 0, rem = 0, noItems = 0;
var mode = "", totalPairs = 0;

/* ─── Sound Engine (Web Audio API) ─── */
function playSound(type) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'win') {
      [523, 659, 784, 1047].forEach(function (f, idx) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.13);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.13 + 0.3);
        o.start(ctx.currentTime + idx * 0.13);
        o.stop(ctx.currentTime + idx * 0.13 + 0.35);
      });
    } else {
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'match') {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'mismatch') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
      }
    }
  } catch (e) {}
}

/* ─── Best Score (localStorage) ─── */
function getBestScore(m) {
  try { return JSON.parse(localStorage.getItem('mm_' + m) || 'null'); } catch (e) { return null; }
}
function saveBestScore(m, totalSec, acc) {
  try {
    var best = getBestScore(m);
    if (!best || totalSec < best.totalSec || (totalSec === best.totalSec && acc > best.acc)) {
      var t = Math.floor(totalSec / 60);
      var timeStr = t > 0 ? t + 'm ' + (totalSec % 60) + 's' : (totalSec % 60) + 's';
      localStorage.setItem('mm_' + m, JSON.stringify({ totalSec: totalSec, time: timeStr, acc: acc }));
      return true;
    }
    return false;
  } catch (e) { return false; }
}

/* ─── Run Init On Window Loader ─── */
window.onload = function () {
  buildStars();
  showStart();
};

function buildStars() {
  var cont = document.querySelector('.stars');
  if (!cont) return;
  for (var i = 0; i < 80; i++) {
    var s = document.createElement('div');
    s.className = 'star';
    var sz = Math.random() * 2.5 + 0.5;
    s.style.cssText = [
      'width:' + sz + 'px', 'height:' + sz + 'px',
      'top:' + Math.random() * 100 + '%', 'left:' + Math.random() * 100 + '%',
      '--dur:' + (Math.random() * 4 + 2) + 's', '--delay:' + (Math.random() * 5) + 's',
      'opacity:' + Math.random()
    ].join(';');
    cont.appendChild(s);
  }
}

/* ─── Show Launcher Window Overlay ─── */
function showStart() {
  var ol = document.getElementById('ol');
  ol.style.display = 'flex';
  ol.style.opacity = '1';
  ol.innerHTML = `
<div class="modal-box">
  <div class="modal-logo">🧠</div>
  <h1 class="modal-title">MEMORY MATCH</h1>
  <p class="modal-subtitle">Train Your Brain</p>
  <ul class="inst-list">
    <li><span class="bullet">1</span>Flip two cards — find matching emoji pairs.</li>
    <li><span class="bullet">2</span>Non-matching cards flip back after 1 second.</li>
    <li><span class="bullet">3</span>Complete the board as fast as you can!</li>
  </ul>
  <div class="glow-divider"></div>
  <div class="diff-label">— Select Difficulty —</div>
  <div class="diff-grid">
    <button class="diff-btn" onclick="start(3,4)">
      <span class="diff-size">3 × 4</span>
      <div class="diff-info">12 CARDS · EASY</div>
    </button>
    <button class="diff-btn" onclick="start(4,4)">
      <span class="diff-size">4 × 4</span>
      <div class="diff-info">16 CARDS · EASY</div>
    </button>
    <button class="diff-btn" onclick="start(4,5)">
      <span class="diff-size">4 × 5</span>
      <div class="diff-info">20 CARDS · MEDIUM</div>
    </button>
    <button class="diff-btn" onclick="start(5,6)">
      <span class="diff-size">5 × 6</span>
      <div class="diff-info">30 CARDS · HARD</div>
    </button>
    <button class="diff-btn" onclick="start(6,6)">
      <span class="diff-size">6 × 6</span>
      <div class="diff-info">36 CARDS · EXPERT</div>
    </button>
  </div>
</div>`;
}

/* ─── Game Control Initialization Trigger ─── */
function start(r, l) {
  clearInterval(gameTimer);
  min = 0; sec = 0; moves = 0;
  totalPairs = (r * l) / 2;
  rem = totalPairs;
  noItems = totalPairs;
  mode = r + "×" + l;

  // Active sync executions at initialization phase
  updateTimer();
  updateMoves();
  updateProgress();
  updateDiff(mode);
  updateAccuracy();

  /* Build dynamic layout content items mapping matrix */
  var items = [];
  for (var i = 0; i < noItems; i++) items.push(em[i]);
  for (var i = 0; i < noItems; i++) items.push(em[i]);
  shuffleArray(items);

  /* Build dynamically structured board tables layout template map mapping loops */
  var tbl = document.querySelector('table');
  tbl.innerHTML = '';
  var n = 1;
  for (var i = 1; i <= r; i++) {
    var tr = document.createElement('tr');
    for (var j = 1; j <= l; j++) {
      var td = document.createElement('td');
      td.id = n;
      td.setAttribute('onclick', 'change(' + n + ')');
      td.innerHTML = `<div class='inner'><div class='front'></div><div class='back'><p>${items[n - 1]}</p></div></div>`;
      tr.appendChild(td);
      n++;
    }
    tbl.appendChild(tr);
  }

  /* Core Game Timing Clock Engine Loop */
  gameTimer = setInterval(function () {
    sec++;
    if (sec === 60) { min++; sec = 0; }
    updateTimer();
  }, 1000);

  /* Operational Launch Overlay Transition Animator UI */
  var ol = document.getElementById('ol');
  ol.style.opacity = '1';
  var fadeOut = setInterval(function () {
    var currentOp = parseFloat(ol.style.opacity);
    ol.style.opacity = (currentOp - 0.07).toString();
    if (parseFloat(ol.style.opacity) <= 0) {
      ol.style.display = 'none';
      clearInterval(fadeOut);
    }
  }, 20);
}

/* ─── Core Interaction Event Handler Tracker Logic ─── */
function change(x) {
  var i = "#" + x + " .inner";
  var b = "#" + x + " .inner .back";

  if (turn === 2 || $(i).attr("flip") === "block" || ppID === x) { return; }

  $(i).css(t_prop, flip);

  if (turn === 1) {
    turn = 2;
    moves++;
    updateMoves();
    updateAccuracy();

    if (pre !== $(b).text()) {
      playSound('mismatch');
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
      $(pID).addClass('wrong-flash');
      $(i).addClass('wrong-flash');
      setTimeout(function () {
        $(pID).css(t_prop, flipBack).removeClass('wrong-flash');
        $(i).css(t_prop, flipBack).removeClass('wrong-flash');
        ppID = 0;
      }, 1000);
    } else {
      rem--;
      playSound('match');
      if (navigator.vibrate) navigator.vibrate(40);
      $(i).attr("flip", "block");
      $(pID).attr("flip", "block");
      updateProgress();
      if (rem === 0) {
        clearInterval(gameTimer);
        var totalSec = min * 60 + sec;
        var timeStr = min > 0 ? min + "m " + sec + "s" : sec + "s";
        var modeDisplay = mode;
        var m = moves, ts = timeStr;
        var acc = Math.round((totalPairs / moves) * 100);
        var isNewBest = saveBestScore(modeDisplay, totalSec, acc);
        setTimeout(function () {
          showWin(modeDisplay, m, ts, acc, isNewBest);
        }, 1500);
      }
    }

    setTimeout(function () { turn = 0; }, 1150);

  } else {
    pre = $(b).text();
    ppID = x;
    pID = "#" + x + " .inner";
    turn = 1;
  }
}

/* ─── End Match Status Report UI Modal Generation Render Window ─── */
function showWin(modeD, mv, ts, acc, isNewBest) {
  playSound('win');
  if (navigator.vibrate) navigator.vibrate([100, 60, 100, 60, 220]);
  var ol = document.getElementById('ol');
  var best = getBestScore(modeD);
  var bestBadge = isNewBest
    ? '<div style="text-align:center;margin-bottom:14px;"><span style="display:inline-block;background:linear-gradient(135deg,rgba(0,245,255,0.12),rgba(168,85,247,0.12));border:1px solid rgba(0,245,255,0.5);border-radius:20px;padding:6px 22px;font-family:Orbitron,monospace;font-size:11px;letter-spacing:0.18em;color:#00f5ff;text-shadow:0 0 8px rgba(0,245,255,0.6);">✦ NEW BEST SCORE ✦</span></div>'
    : (best ? '<div style="text-align:center;margin-bottom:10px;font-size:11px;color:#64748b;font-family:Orbitron,monospace;letter-spacing:0.1em;">BEST: ' + best.time + ' · ' + best.acc + '% ACC</div>' : '');
  ol.innerHTML = `
<div class="modal-box">
  <div class="modal-logo">🏆</div>
  <h1 class="modal-title">MISSION COMPLETE</h1>
  <p class="modal-subtitle">${modeD} Mode Cleared</p>
  ${bestBadge}
  <div class="win-stats-grid">
    <div class="win-stat-card">
      <div class="win-stat-val">${ts}</div>
      <div class="win-stat-key">⏱ TIME TAKEN</div>
    </div>
    <div class="win-stat-card">
      <div class="win-stat-val purple">${mv}</div>
      <div class="win-stat-key">🎮 TOTAL MOVES</div>
    </div>
    <div class="win-stat-card">
      <div class="win-stat-val">${acc}%</div>
      <div class="win-stat-key">🎯 ACCURACY</div>
    </div>
    <div class="win-stat-card">
      <div class="win-stat-val purple">${modeD}</div>
      <div class="win-stat-key">🔥 DIFFICULTY</div>
    </div>
  </div>
  <div class="glow-divider"></div>
  <div class="diff-label">— Play Again —</div>
  <div class="diff-grid">
    <button class="diff-btn" onclick="start(3,4)"><span class="diff-size">3×4</span><div class="diff-info">EASY</div></button>
    <button class="diff-btn" onclick="start(4,4)"><span class="diff-size">4×4</span><div class="diff-info">EASY</div></button>
    <button class="diff-btn" onclick="start(4,5)"><span class="diff-size">4×5</span><div class="diff-info">MEDIUM</div></button>
    <button class="diff-btn" onclick="start(5,6)"><span class="diff-size">5×6</span><div class="diff-info">HARD</div></button>
    <button class="diff-btn" onclick="start(6,6)"><span class="diff-size">6×6</span><div class="diff-info">EXPERT</div></button>
  </div>
</div>`;
  ol.style.opacity = '0';
  ol.style.display = 'flex';
  var fadeIn = setInterval(function () {
    var currentOp = parseFloat(ol.style.opacity);
    ol.style.opacity = (currentOp + 0.07).toString();
    if (parseFloat(ol.style.opacity) >= 1) { ol.style.opacity = '1'; clearInterval(fadeIn); }
  }, 20);
}

/* ─── Integrated UI Global Sync State Refresher Realtime Modules ─── */
function updateTimer() {
  var s = sec < 10 ? '0' + sec : sec;
  var m = min < 10 ? '0' + min : min;
  var displayTime = m + ':' + s;

  // Refreshes upper and sidebar components uniformly in sync
  var elHead = document.getElementById('stat-time');
  var elSide = document.getElementById('side-time');
  if (elHead) elHead.textContent = displayTime;
  if (elSide) elSide.textContent = displayTime;
}

function updateMoves() {
  var elHead = document.getElementById('stat-moves');
  var elSide = document.getElementById('side-moves');
  if (elHead) elHead.textContent = moves;
  if (elSide) elSide.textContent = moves;
}

function updateProgress() {
  var matched = totalPairs - rem;
  var pct = totalPairs > 0 ? Math.round((matched / totalPairs) * 100) : 0;
  var bar = document.getElementById('progress-fill');
  var lbl = document.getElementById('progress-lbl');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = matched + ' / ' + totalPairs + ' pairs';
}

function updateDiff(m) {
  var elHead = document.getElementById('stat-diff');
  var elSide = document.getElementById('side-diff');
  if (elHead) elHead.textContent = m;
  if (elSide) elSide.textContent = m;
}

function updateAccuracy() {
  var acc = moves > 0 ? Math.round(((totalPairs - rem) / moves) * 100) : 100;
  var elHead = document.getElementById('stat-acc');
  var elSide = document.getElementById('side-acc');
  if (elHead) elHead.textContent = acc + '%';
  if (elSide) elSide.textContent = acc + '%';
}
