/* Hoofdlogica: quiz-flow, score, timer, toetsenbord. */
(function () {
  "use strict";

  const TIMER_SECONDS = 45; // ruime tijd per vraag; echte tests zitten rond 30-60s

  const $ = (id) => document.getElementById(id);
  const menuEl = $("menu");
  const quizEl = $("quiz");
  const promptEl = $("prompt");
  const optionsEl = $("options");
  const feedbackEl = $("feedback");
  const feedbackHeadline = $("feedback-headline");
  const feedbackExplanation = $("feedback-explanation");
  const timerEl = $("q-timer");

  const generators = {
    numbers: () => Sequences.generateNumber(),
    letters: () => Sequences.generateLetter(),
    rotation: () => Rotation.generate(),
  };
  generators.mixed = () => {
    const keys = Object.keys(generators).filter((k) => k !== "mixed");
    return generators[keys[Math.floor(Math.random() * keys.length)]]();
  };

  const state = {
    category: null,
    question: null,
    count: 0,
    score: 0,
    streak: 0,
    answered: false,
    timerId: null,
    timeLeft: 0,
  };

  function useTimer() {
    return $("timer-toggle").checked;
  }
  function autoAdvance() {
    return $("autoadvance-toggle").checked;
  }

  function startCategory(cat) {
    state.category = cat;
    state.count = 0;
    state.score = 0;
    state.streak = 0;
    menuEl.classList.add("hidden");
    quizEl.classList.remove("hidden");
    nextQuestion();
  }

  function backToMenu() {
    stopTimer();
    quizEl.classList.add("hidden");
    menuEl.classList.remove("hidden");
    if (state.count > 0) {
      $("session-summary").textContent =
        "Laatste sessie: " + state.score + " van " + state.count + " goed.";
    }
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    if (!useTimer()) {
      timerEl.textContent = "--";
      timerEl.classList.remove("low");
      return;
    }
    state.timeLeft = TIMER_SECONDS;
    renderTimer();
    state.timerId = setInterval(() => {
      state.timeLeft--;
      renderTimer();
      if (state.timeLeft <= 0) {
        stopTimer();
        timeUp();
      }
    }, 1000);
  }

  function renderTimer() {
    timerEl.textContent = state.timeLeft + "s";
    timerEl.classList.toggle("low", state.timeLeft <= 10);
  }

  function nextQuestion() {
    state.answered = false;
    state.count++;
    state.question = generators[state.category]();
    render();
    startTimer();
  }

  function render() {
    const q = state.question;
    $("q-count").textContent = String(state.count);
    $("q-score").textContent = String(state.score);
    $("q-streak").textContent = String(state.streak);

    // prompt
    promptEl.innerHTML = "";
    q.prompt.forEach((cell) => {
      const div = document.createElement("div");
      div.className = "cell" + (cell.mystery ? " mystery" : "");
      if (cell.mystery) div.textContent = "?";
      else if (cell.svg) div.innerHTML = cell.svg;
      else div.textContent = cell.text;
      promptEl.appendChild(div);
    });

    // opties
    optionsEl.innerHTML = "";
    const labels = ["a", "b", "c", "d", "e", "f"];
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.dataset.index = String(i);
      const key = document.createElement("span");
      key.className = "key";
      key.textContent = (i + 1) + " · " + labels[i];
      btn.appendChild(key);
      if (opt.svg) {
        const wrap = document.createElement("span");
        wrap.innerHTML = opt.svg;
        btn.appendChild(wrap.firstChild);
      } else {
        btn.appendChild(document.createTextNode(opt.text));
      }
      btn.addEventListener("click", () => answer(i));
      optionsEl.appendChild(btn);
    });

    feedbackEl.classList.add("hidden");
  }

  function lockOptions() {
    optionsEl.querySelectorAll(".option").forEach((b) => (b.disabled = true));
  }

  function markOptions(chosen) {
    const q = state.question;
    optionsEl.querySelectorAll(".option").forEach((b, i) => {
      if (i === q.correctIndex) b.classList.add("correct");
      else if (i === chosen) b.classList.add("wrong");
    });
  }

  function answer(i) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();
    lockOptions();
    const q = state.question;
    const good = i === q.correctIndex;
    if (good) {
      state.score++;
      state.streak++;
    } else {
      state.streak = 0;
    }
    markOptions(i);
    showFeedback(
      good ? "Goed!" : "Helaas, dat is niet juist.",
      good,
      q.explanation
    );
    if (good && autoAdvance()) {
      setTimeout(() => {
        if (state.answered && !quizEl.classList.contains("hidden")) nextQuestion();
      }, 1400);
    }
  }

  function timeUp() {
    if (state.answered) return;
    state.answered = true;
    state.streak = 0;
    lockOptions();
    markOptions(-1);
    showFeedback("De tijd is om!", false, state.question.explanation);
  }

  function showFeedback(text, good, explanation) {
    feedbackHeadline.textContent = text;
    feedbackHeadline.className = "feedback-headline " + (good ? "good" : "bad");
    feedbackExplanation.textContent = explanation;
    feedbackEl.classList.remove("hidden");
    $("q-score").textContent = String(state.score);
    $("q-streak").textContent = String(state.streak);
  }

  /* --- events --- */
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => startCategory(btn.dataset.cat));
  });
  $("back-btn").addEventListener("click", backToMenu);
  $("next-btn").addEventListener("click", nextQuestion);

  document.addEventListener("keydown", (e) => {
    if (quizEl.classList.contains("hidden")) return;
    if (e.key >= "1" && e.key <= "6") {
      const i = Number(e.key) - 1;
      if (i < state.question.options.length) answer(i);
    } else if ((e.key === "Enter" || e.key === " ") && state.answered) {
      e.preventDefault();
      nextQuestion();
    } else if (e.key === "Escape") {
      backToMenu();
    }
  });
})();
