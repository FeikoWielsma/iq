/* Hoofdlogica: oefenen, moeilijkheid/adaptief, toetsmodus en statistieken. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // Categorieën met label; volgorde bepaalt de menuvolgorde.
  const CATEGORIES = [
    { id: "figures", name: "Figurenreeksen", gen: (d) => Figures.generateSeries(d) },
    { id: "staticseries", name: "Statische reeks", gen: (d) => StaticSeries.generate(d) },
    { id: "arrows", name: "Pijlen & stippen", gen: (d) => Arrows.generate(d) },
    { id: "counting", name: "Aantallen tellen", gen: (d) => Counting.generate(d) },
    { id: "movement", name: "Verplaatsing", gen: (d) => Movement.generate(d) },
    { id: "rotation", name: "Figuren roteren", gen: (d) => Rotation.generate(d) },
    { id: "matrix", name: "Abstracte matrices", gen: (d) => Matrix.generate(d) },
    { id: "fused", name: "Draaien & tellen", gen: (d) => Fused.generate(d) },
    { id: "scene", name: "Gekleurde composities", gen: (d) => Scene.generate(d) },
    { id: "oddone", name: "Uitzondering zoeken", gen: (d) => Figures.generateOddOneOut(d) },
    { id: "analogy", name: "Analogieën", gen: (d) => Figures.generateAnalogy(d) },
    { id: "cube", name: "Kubus vouwen", gen: (d) => Cube.generate(d) },
    { id: "syllogism", name: "Syllogismen", gen: (d) => Syllogism.generate(d) },
    { id: "numbers", name: "Getallenreeksen", gen: (d) => Sequences.generateNumber(d) },
    { id: "letters", name: "Letterreeksen", gen: (d) => Sequences.generateLetter(d) },
  ];
  const NAME = {};
  const generators = {};
  CATEGORIES.forEach((c) => { NAME[c.id] = c.name; generators[c.id] = c.gen; });

  /* ---------- instellingen (localStorage) ---------- */
  const MIX_KEY = "iq-mixed-cats-v1";
  const DIFF_KEY = "iq-difficulty-v1";
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  function loadEnabled() {
    const raw = lsGet(MIX_KEY);
    if (raw) { try { return new Set(JSON.parse(raw)); } catch (e) { /* ignore */ } }
    return new Set(CATEGORIES.map((c) => c.id));
  }
  const enabled = loadEnabled();
  function saveEnabled() { lsSet(MIX_KEY, JSON.stringify([...enabled])); }

  let difficultyMode = lsGet(DIFF_KEY) || "2"; // "1" | "2" | "3" | "adaptief"

  /* ---------- schermbeheer ---------- */
  const SECTIONS = ["menu", "quiz", "results", "stats", "cct"];
  function show(id) { SECTIONS.forEach((s) => $(s).classList.toggle("hidden", s !== id)); }

  /* ---------- vraagkeuze + moeilijkheid ---------- */
  function enabledPool() {
    const active = CATEGORIES.map((c) => c.id).filter((id) => enabled.has(id));
    return active.length ? active : CATEGORIES.map((c) => c.id);
  }
  function weightedPick(items, weights) {
    let sum = 0;
    for (const w of weights) sum += w;
    let r = Math.random() * sum;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
  function adaptivePickCategory(pool) {
    const bt = Stats.byType();
    const weights = pool.map((id) => {
      const b = bt[id];
      if (!b || b.n < 3) return 0.6; // weinig data → redelijke kans
      return Math.max(0.15, 1 - b.acc); // zwakker → vaker
    });
    return weightedPick(pool, weights);
  }
  function adaptiveDifficulty(cat) {
    const b = Stats.byType()[cat];
    if (!b || b.n < 5) return 2;
    if (b.acc > 0.8) return 3;
    if (b.acc < 0.4) return 1;
    return 2;
  }
  function resolveCategory(category) {
    if (category !== "mixed") return category;
    const pool = enabledPool();
    if (difficultyMode === "adaptief") return adaptivePickCategory(pool);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function difficultyFor(cat) {
    if (difficultyMode === "adaptief") return adaptiveDifficulty(cat);
    return Number(difficultyMode);
  }
  function makeQuestion(category) {
    const cat = resolveCategory(category);
    return generators[cat](difficultyFor(cat));
  }
  function timerSecondsFor(q) {
    return q.difficulty >= 3 ? 30 : 45; // pittiger niveau = strakkere tijd
  }

  /* ---------- render van prompt & opties ---------- */
  function renderPrompt(el, q) {
    el.innerHTML = "";
    el.classList.toggle("hidden", q.prompt.length === 0);
    q.prompt.forEach((cell) => {
      const div = document.createElement("div");
      if (cell.sep) { div.className = "cell sep"; div.textContent = cell.sep; }
      else if (cell.plain) { div.className = "premise"; div.textContent = cell.text; }
      else {
        div.className = "cell" + (cell.mystery ? " mystery" : "") + (cell.wide ? " wide" : "");
        if (cell.mystery) div.textContent = "?";
        else if (cell.svg) div.innerHTML = cell.svg;
        else div.textContent = cell.text;
      }
      el.appendChild(div);
    });
  }
  const LABELS = ["a", "b", "c", "d", "e", "f"];
  function renderOptions(el, q, opts) {
    // opts: { interactive, chosen, onClick }
    el.innerHTML = "";
    el.classList.toggle("text-options", q.optionLayout === "text");
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option";
      const key = document.createElement("span");
      key.className = "key";
      key.textContent = (i + 1) + " · " + LABELS[i];
      btn.appendChild(key);
      if (opt.svg) {
        const wrap = document.createElement("span");
        wrap.innerHTML = opt.svg;
        btn.appendChild(wrap.firstChild);
      } else {
        btn.appendChild(document.createTextNode(opt.text));
      }
      if (opts.interactive) {
        btn.addEventListener("click", () => opts.onClick(i));
      } else {
        btn.disabled = true;
        if (i === q.correctIndex) btn.classList.add("correct");
        else if (i === opts.chosen) btn.classList.add("wrong");
      }
      el.appendChild(btn);
    });
  }

  /* ================= OEFENMODUS ================= */
  const practice = {
    category: null, question: null, count: 0, score: 0, streak: 0,
    answered: false, timerId: null, timeLeft: 0, qStart: 0,
  };

  function useTimer() { return $("timer-toggle").checked; }
  function autoAdvance() { return $("autoadvance-toggle").checked; }

  function startPractice(category) {
    mode = "practice";
    practice.category = category;
    practice.count = 0; practice.score = 0; practice.streak = 0;
    $("quiz").classList.remove("exam-mode");
    $("exam-controls").classList.add("hidden");
    show("quiz");
    nextPractice();
  }

  function nextPractice() {
    practice.answered = false;
    practice.count++;
    practice.question = makeQuestion(practice.category);
    practice.qStart = Date.now();
    $("stat-count").innerHTML = "Vraag <b>" + practice.count + "</b>";
    $("q-title").textContent = practice.question.title || "";
    renderPrompt($("prompt"), practice.question);
    renderOptions($("options"), practice.question, { interactive: true, onClick: answerPractice });
    $("q-score").textContent = String(practice.score);
    $("q-streak").textContent = String(practice.streak);
    $("feedback").classList.add("hidden");
    startQTimer();
  }

  function startQTimer() {
    stopQTimer();
    if (!useTimer()) { $("q-timer").textContent = "--"; $("q-timer").classList.remove("low"); return; }
    practice.timeLeft = timerSecondsFor(practice.question);
    renderQTimer();
    practice.timerId = setInterval(() => {
      practice.timeLeft--;
      renderQTimer();
      if (practice.timeLeft <= 0) { stopQTimer(); timeUpPractice(); }
    }, 1000);
  }
  function stopQTimer() { if (practice.timerId) { clearInterval(practice.timerId); practice.timerId = null; } }
  function renderQTimer() {
    $("q-timer").textContent = practice.timeLeft + "s";
    $("q-timer").classList.toggle("low", practice.timeLeft <= 10);
  }

  function recordAnswer(q, correct, chosen) {
    Stats.record({
      type: q.type, ruleTag: q.ruleTag, correct: correct,
      timeMs: Date.now() - practice.qStart, difficulty: q.difficulty, exam: false,
    });
  }

  function answerPractice(i) {
    if (practice.answered) return;
    practice.answered = true;
    stopQTimer();
    const q = practice.question;
    const good = i === q.correctIndex;
    if (good) { practice.score++; practice.streak++; } else { practice.streak = 0; }
    recordAnswer(q, good, i);
    // markeer knoppen
    $("options").querySelectorAll(".option").forEach((b, idx) => {
      b.disabled = true;
      if (idx === q.correctIndex) b.classList.add("correct");
      else if (idx === i) b.classList.add("wrong");
    });
    showFeedback(good ? "Goed!" : "Helaas, dat is niet juist.", good, q.explanation);
    if (good && autoAdvance()) {
      setTimeout(() => {
        if (practice.answered && mode === "practice" && !$("quiz").classList.contains("hidden")) nextPractice();
      }, 1300);
    }
  }

  function timeUpPractice() {
    if (practice.answered) return;
    practice.answered = true;
    practice.streak = 0;
    const q = practice.question;
    recordAnswer(q, false, -1);
    $("options").querySelectorAll(".option").forEach((b, idx) => {
      b.disabled = true;
      if (idx === q.correctIndex) b.classList.add("correct");
    });
    showFeedback("De tijd is om!", false, q.explanation);
  }

  function showFeedback(text, good, explanation) {
    $("feedback-headline").textContent = text;
    $("feedback-headline").className = "feedback-headline " + (good ? "good" : "bad");
    $("feedback-explanation").textContent = explanation;
    renderSolution(practice.question);
    $("feedback").classList.remove("hidden");
    $("q-score").textContent = String(practice.score);
    $("q-streak").textContent = String(practice.streak);
  }

  // Visuele uitleg: sommige generatoren leveren een `solution` met de volledige
  // reeks (incl. het antwoord). Die tonen we onder de tekstuele uitleg.
  function renderSolution(q) {
    const host = $("feedback-solution");
    host.innerHTML = "";
    if (!q || !q.solution || !q.solution.cells) { host.classList.add("hidden"); return; }
    host.classList.remove("hidden");
    if (q.solution.note) {
      const n = document.createElement("div");
      n.className = "solution-note";
      n.textContent = q.solution.note;
      host.appendChild(n);
    }
    const row = document.createElement("div");
    row.className = "prompt-row small solution-row";
    q.solution.cells.forEach((c) => {
      const div = document.createElement("div");
      div.className = "cell" + (c.answer ? " answer" : "") + (c.wide ? " wide" : "");
      if (c.svg) div.innerHTML = c.svg;
      else div.textContent = c.text || "";
      row.appendChild(div);
    });
    host.appendChild(row);
  }

  function backToMenu() {
    stopQTimer();
    stopExamTimer();
    show("menu");
    if (mode === "practice" && practice.count > 0) {
      $("session-summary").textContent =
        "Laatste sessie: " + practice.score + " van " + practice.count + " goed.";
    }
  }

  /* ================= TOETSMODUS ================= */
  let mode = "practice";
  const exam = { items: [], idx: 0, total: 0, endTime: 0, timerId: null };

  function startExam() {
    mode = "exam";
    const total = Number($("exam-count").value);
    const minutes = Number($("exam-min").value);
    exam.total = total;
    exam.idx = 0;
    exam.endTime = Date.now() + minutes * 60000;
    exam.items = [];
    for (let k = 0; k < total; k++) {
      exam.items.push({ q: makeQuestion("mixed"), chosen: null, answered: false, correct: false });
    }
    $("quiz").classList.add("exam-mode");
    $("exam-controls").classList.remove("hidden");
    $("feedback").classList.add("hidden");
    show("quiz");
    renderExam();
    startExamTimer();
  }

  function renderExam() {
    const it = exam.items[exam.idx];
    const answered = exam.items.filter((x) => x.answered).length;
    $("stat-count").innerHTML = "Vraag <b>" + (exam.idx + 1) + "</b>/" + exam.total +
      " · beantwoord <b>" + answered + "</b>";
    $("q-title").textContent = it.q.title || "";
    renderPrompt($("prompt"), it.q);
    renderOptions($("options"), it.q, { interactive: true, onClick: answerExam });
  }

  function answerExam(i) {
    const it = exam.items[exam.idx];
    if (it.answered) return;
    it.chosen = i;
    it.answered = true;
    it.correct = i === it.q.correctIndex;
    Stats.record({
      type: it.q.type, ruleTag: it.q.ruleTag, correct: it.correct,
      timeMs: 0, difficulty: it.q.difficulty, exam: true,
    });
    gotoNextExam();
  }
  function gotoNextExam() {
    const n = exam.items.length;
    for (let k = 1; k <= n; k++) {
      const j = (exam.idx + k) % n;
      if (!exam.items[j].answered) { exam.idx = j; renderExam(); return; }
    }
    finishExam(); // alles beantwoord
  }

  function startExamTimer() {
    stopExamTimer();
    renderExamTimer();
    exam.timerId = setInterval(() => {
      renderExamTimer();
      if (Date.now() >= exam.endTime) { stopExamTimer(); finishExam(); }
    }, 500);
  }
  function stopExamTimer() { if (exam.timerId) { clearInterval(exam.timerId); exam.timerId = null; } }
  function renderExamTimer() {
    const ms = Math.max(0, exam.endTime - Date.now());
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60), ss = s % 60;
    $("q-timer").textContent = mm + ":" + (ss < 10 ? "0" : "") + ss;
    $("q-timer").classList.toggle("low", s <= 60);
  }

  function finishExam() {
    stopExamTimer();
    mode = "practice";
    buildResults();
    show("results");
  }

  function buildResults() {
    const items = exam.items;
    const answered = items.filter((x) => x.answered);
    const correct = items.filter((x) => x.correct).length;
    const skipped = items.length - answered.length;

    $("results-summary").innerHTML =
      "<div class='big-score'>" + correct + " / " + items.length + " goed</div>" +
      "<div class='muted'>" + Math.round((correct / items.length) * 100) + "% · " +
      skipped + " overgeslagen</div>";

    // per categorie
    const byType = {};
    items.forEach((it) => {
      const t = it.q.type;
      const b = (byType[t] = byType[t] || { n: 0, correct: 0 });
      b.n++; if (it.correct) b.correct++;
    });
    const bd = $("results-breakdown");
    bd.innerHTML = "";
    Object.keys(byType).forEach((t) => {
      const b = byType[t];
      bd.appendChild(barRow(NAME[t] || t, b.correct, b.n));
    });

    // nabespreking: fout of overgeslagen
    const review = $("results-review");
    review.innerHTML = "";
    const wrong = items.filter((it) => !it.correct);
    if (!wrong.length) {
      review.innerHTML = "<p class='muted'>Alles goed — niets na te bespreken!</p>";
    }
    wrong.forEach((it, n) => {
      const card = document.createElement("div");
      card.className = "review-item";
      const head = document.createElement("div");
      head.className = "review-head";
      head.textContent = (n + 1) + ". " + (NAME[it.q.type] || it.q.type) +
        (it.answered ? "" : " (overgeslagen)");
      card.appendChild(head);
      const p = document.createElement("div");
      p.className = "prompt-row small";
      card.appendChild(p);
      renderPrompt(p, it.q);
      const o = document.createElement("div");
      o.className = "options-grid small";
      card.appendChild(o);
      renderOptions(o, it.q, { interactive: false, chosen: it.chosen });
      const ex = document.createElement("div");
      ex.className = "feedback-explanation";
      ex.textContent = it.q.explanation;
      card.appendChild(ex);
      review.appendChild(card);
    });
  }

  function barRow(label, correct, n) {
    const pct = n ? Math.round((correct / n) * 100) : 0;
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML =
      "<span class='bar-label'>" + label + "</span>" +
      "<span class='bar-track'><span class='bar-fill' style='width:" + pct + "%'></span></span>" +
      "<span class='bar-val'>" + correct + "/" + n + "</span>";
    return row;
  }

  /* ================= STATISTIEKEN ================= */
  function openStats() {
    const sum = Stats.summary();
    $("stats-summary").innerHTML =
      "<div class='big-score'>" + sum.correct + " / " + sum.total + " goed</div>" +
      "<div class='muted'>" + (sum.total ? Math.round(sum.acc * 100) : 0) +
      "% over alle vragen · beste reeks: " + Stats.bestStreak() + "</div>";

    const bt = Stats.byType();
    const byTypeEl = $("stats-bytype");
    byTypeEl.innerHTML = "";
    const ids = CATEGORIES.map((c) => c.id).filter((id) => bt[id]);
    if (!ids.length) byTypeEl.innerHTML = "<p class='muted'>Nog geen gegevens. Oefen eerst wat vragen.</p>";
    ids.forEach((id) => byTypeEl.appendChild(barRow(NAME[id], bt[id].correct, bt[id].n)));

    const weak = Stats.weakest(5, 5);
    const weakEl = $("stats-weak");
    weakEl.innerHTML = "";
    if (!weak.length) weakEl.innerHTML = "<p class='muted'>Nog te weinig data (minstens 5 per onderdeel).</p>";
    weak.forEach((w) => weakEl.appendChild(barRow(ruleLabel(w.ruleTag), w.correct, w.n)));

    show("stats");
  }

  function ruleLabel(tag) {
    const parts = String(tag).split(":");
    const cat = NAME[parts[0]] || parts[0];
    return parts[1] ? cat + " · " + parts[1] : cat;
  }

  function exportStats() {
    const blob = new Blob([Stats.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "capaciteitentest-stats.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function importStats(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const added = Stats.importJSON(String(reader.result));
        openStats();
        alert(added + " nieuwe records geïmporteerd.");
      } catch (e) {
        alert("Importeren mislukt: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  /* ================= MENU + EVENTS ================= */
  function buildCategoryList() {
    const list = $("cat-list");
    list.innerHTML = "";
    CATEGORIES.forEach((c) => {
      const row = document.createElement("div");
      row.className = "cat-row";
      const label = document.createElement("label");
      label.className = "toggle cat-include";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = enabled.has(c.id);
      cb.addEventListener("change", () => {
        if (cb.checked) enabled.add(c.id); else enabled.delete(c.id);
        saveEnabled();
      });
      const span = document.createElement("span");
      span.textContent = c.name;
      label.appendChild(cb); label.appendChild(span);
      const btn = document.createElement("button");
      btn.className = "ghost-btn oefen-btn";
      btn.textContent = "Oefen";
      btn.addEventListener("click", () => startPractice(c.id));
      row.appendChild(label); row.appendChild(btn);
      list.appendChild(row);
    });
  }

  function initDifficultyRadios() {
    document.querySelectorAll("input[name=diff]").forEach((r) => {
      r.checked = r.value === difficultyMode;
      r.addEventListener("change", () => {
        if (r.checked) { difficultyMode = r.value; lsSet(DIFF_KEY, difficultyMode); }
      });
    });
  }

  buildCategoryList();
  initDifficultyRadios();

  $("start-mixed").addEventListener("click", () => startPractice("mixed"));
  $("start-exam").addEventListener("click", startExam);
  $("start-cct").addEventListener("click", () => { show("cct"); CCT.start(); });
  $("cct-back").addEventListener("click", () => { CCT.stop(); show("menu"); });
  CCT.wire();
  $("back-btn").addEventListener("click", backToMenu);
  $("next-btn").addEventListener("click", nextPractice);
  $("skip-btn").addEventListener("click", gotoNextExam);
  $("finish-btn").addEventListener("click", finishExam);
  $("results-back").addEventListener("click", () => show("menu"));
  $("show-stats").addEventListener("click", openStats);
  $("stats-back").addEventListener("click", () => show("menu"));
  $("stats-adaptive").addEventListener("click", () => {
    difficultyMode = "adaptief";
    lsSet(DIFF_KEY, difficultyMode);
    initDifficultyRadios();
    startPractice("mixed");
  });
  $("stats-export").addEventListener("click", exportStats);
  $("stats-import").addEventListener("click", () => $("stats-file").click());
  $("stats-file").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) importStats(e.target.files[0]);
    e.target.value = "";
  });
  $("stats-clear").addEventListener("click", () => {
    if (confirm("Alle statistieken wissen?")) { Stats.clear(); openStats(); }
  });

  document.addEventListener("keydown", (e) => {
    if ($("quiz").classList.contains("hidden")) return;
    const q = mode === "exam" ? exam.items[exam.idx].q : practice.question;
    if (!q) return;
    if (e.key >= "1" && e.key <= "6") {
      const i = Number(e.key) - 1;
      if (i < q.options.length) { mode === "exam" ? answerExam(i) : answerPractice(i); }
    } else if (mode === "practice" && (e.key === "Enter" || e.key === " ") && practice.answered) {
      e.preventDefault(); nextPractice();
    } else if (mode === "exam" && e.key === "Enter") {
      e.preventDefault(); gotoNextExam();
    } else if (e.key === "Escape") {
      backToMenu();
    }
  });
})();
