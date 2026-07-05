/* "Woord omgekeerd" — CCT-achtige werkgeheugentaak (backward span).
   Toon een letterreeks; de kandidaat vult het OMGEKEERDE woord aan, waarvan een
   deel al is ingevuld. Invoer via het scherm-toetsenbord of het echte toetsenbord.
   Eigen scherm (geen meerkeuze). Score per item (alle gaten goed) in Stats. */
(function (global) {
  "use strict";

  const S = global.Sequences;
  const ALPHA = "abcdefghijklmnopqrstuvwxyz";
  const ITEM_SECONDS = 30;

  let st = null;
  let onExit = null;
  let count = 0, score = 0;
  let timerId = null, timeLeft = 0;

  const $ = (id) => document.getElementById(id);

  function randomWord(len) {
    let w = "";
    for (let i = 0; i < len; i++) w += ALPHA[S.randInt(0, 25)];
    return w;
  }

  function newItem() {
    const len = S.randInt(5, 7);
    const source = randomWord(len);
    const target = source.split("").reverse().join("");
    // ~40% gaten, minstens 2
    const nBlanks = Math.max(2, Math.round(len * 0.4));
    const blanks = S.shuffle(target.split("").map((_, i) => i)).slice(0, nBlanks).sort((a, b) => a - b);
    const filled = target.split("").map((ch, i) => (blanks.indexOf(i) >= 0 ? "" : ch));
    return { source, target, blanks, filled, cur: 0, done: false };
  }

  function buildKeyboard() {
    const kb = $("cct-keyboard");
    if (kb.childElementCount) return; // eenmalig
    for (const ch of ALPHA) {
      const b = document.createElement("button");
      b.className = "key-btn";
      b.textContent = ch;
      b.addEventListener("click", () => typeLetter(ch));
      kb.appendChild(b);
    }
  }

  function renderRow(el, chars, opts) {
    el.innerHTML = "";
    chars.forEach((ch, i) => {
      const c = document.createElement("div");
      c.className = "cct-cell";
      if (opts && opts.blanks && opts.blanks.indexOf(i) >= 0) c.classList.add("blank");
      if (opts && i === opts.active) c.classList.add("active");
      if (opts && opts.marks && opts.marks[i]) c.classList.add(opts.marks[i]);
      c.textContent = ch ? ch.toUpperCase() : "";
      el.appendChild(c);
    });
  }

  function render() {
    $("cct-count").textContent = String(count);
    $("cct-score").textContent = String(score);
    renderRow($("cct-source"), st.source.split(""));
    const active = st.done ? -1 : st.blanks[st.cur];
    renderRow($("cct-answer"), st.filled, { blanks: st.blanks, active: active, marks: st.marks });
    $("cct-feedback").classList.toggle("hidden", !st.done);
  }

  function typeLetter(ch) {
    if (!st || st.done) return;
    if (st.cur >= st.blanks.length) return;
    st.filled[st.blanks[st.cur]] = ch;
    st.cur++;
    if (st.cur >= st.blanks.length) check();
    else render();
  }
  function backspace() {
    if (!st || st.done) return;
    if (st.cur > 0) { st.cur--; st.filled[st.blanks[st.cur]] = ""; render(); }
  }

  function check() {
    stopTimer();
    st.done = true;
    let allGood = true;
    st.marks = {};
    st.blanks.forEach((i) => {
      const good = st.filled[i] === st.target[i];
      st.marks[i] = good ? "good" : "bad";
      if (!good) { allGood = false; st.filled[i] = st.target[i]; } // toon juiste letter
    });
    if (allGood) score++;
    Stats.record({ type: "cct", ruleTag: "cct", correct: allGood, timeMs: 0, difficulty: 2 });
    $("cct-headline").textContent = allGood ? "Goed!" : "Niet helemaal — de juiste letters staan nu ingevuld.";
    $("cct-headline").className = "feedback-headline " + (allGood ? "good" : "bad");
    render();
  }

  function next() {
    count++;
    st = newItem();
    render();
    startTimer();
  }

  function startTimer() {
    stopTimer();
    timeLeft = ITEM_SECONDS;
    renderTimer();
    timerId = setInterval(() => {
      timeLeft--;
      renderTimer();
      if (timeLeft <= 0) { stopTimer(); if (!st.done) check(); }
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function renderTimer() {
    $("cct-timer").textContent = timeLeft + "s";
    $("cct-timer").classList.toggle("low", timeLeft <= 8);
  }

  function start(exitCb) {
    onExit = exitCb;
    count = 0; score = 0;
    buildKeyboard();
    next();
  }
  function stop() { stopTimer(); }

  document.addEventListener("keydown", (e) => {
    if ($("cct").classList.contains("hidden")) return;
    if (e.key === "Backspace") { e.preventDefault(); backspace(); }
    else if (e.key === "Enter" && st && st.done) { e.preventDefault(); next(); }
    else if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key.toLowerCase());
  });

  // knoppen worden door app.js gekoppeld, maar 'volgende' zit hier
  function wire() {
    $("cct-next").addEventListener("click", next);
  }

  global.CCT = { start, stop, wire };
})(window);
