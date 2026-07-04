/* Getallen- en letterreeks generatoren.
   Elke generator geeft een vraagobject terug:
   {
     type, prompt: [{text}|{mystery:true}], options: [{text}],
     correctIndex, explanation
   }
*/
(function (global) {
  "use strict";

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Bouw 6 antwoordopties (5 fout + 1 goed) uit een numerieke waarde.
     `candidates` zijn "logische" foute antwoorden; we vullen aan met offsets. */
  function buildNumberOptions(correct, candidates) {
    const wrongs = new Set();
    const tryAdd = (v) => {
      if (v !== correct && Number.isFinite(v) && !wrongs.has(v)) wrongs.add(v);
    };
    (candidates || []).forEach(tryAdd);
    // vul aan met dichte offsets
    const offsets = shuffle([1, 2, 3, -1, -2, -3, 4, -4, 5, -5, 10, -10]);
    let oi = 0;
    while (wrongs.size < 5 && oi < offsets.length) {
      tryAdd(correct + offsets[oi++]);
    }
    // laatste redmiddel: willekeurig
    while (wrongs.size < 5) tryAdd(correct + randInt(6, 40));

    const wrongArr = shuffle(Array.from(wrongs)).slice(0, 5);
    const opts = shuffle(wrongArr.concat([correct]));
    return {
      options: opts.map((v) => ({ text: String(v) })),
      correctIndex: opts.indexOf(correct),
    };
  }

  const numberRules = [
    // Rekenkundig: constante stap
    function arithmetic() {
      const start = randInt(1, 12);
      const step = pick([2, 3, 4, 5, 6, 7, -3, -4]);
      const seq = [];
      for (let i = 0; i < 6; i++) seq.push(start + i * step);
      const correct = seq[5];
      return {
        seq,
        correct,
        candidates: [correct + step, correct - step, correct + 2 * step],
        explanation: `Elke term stijgt met ${step >= 0 ? "+" : ""}${step}. Na ${seq[4]} volgt ${seq[4]} ${step >= 0 ? "+ " + step : "- " + -step} = ${correct}.`,
      };
    },
    // Meetkundig: constante factor
    function geometric() {
      const start = pick([1, 2, 3, 2, 3]);
      const ratio = pick([2, 3]);
      const seq = [];
      for (let i = 0; i < 6; i++) seq.push(start * Math.pow(ratio, i));
      const correct = seq[5];
      return {
        seq,
        correct,
        candidates: [seq[4] + seq[4], correct + ratio, seq[4] * (ratio + 1)],
        explanation: `Elke term wordt ${ratio}× de vorige. ${seq[4]} × ${ratio} = ${correct}.`,
      };
    },
    // Fibonacci-achtig: som van de twee vorige (zoals 5,6,11,17,28,45)
    function fibonacci() {
      const a = randInt(2, 9);
      const b = randInt(a, a + 8);
      const seq = [a, b];
      for (let i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2]);
      const correct = seq[5];
      return {
        seq,
        correct,
        candidates: [seq[4] + seq[3] + 1, seq[4] * 2, seq[4] + seq[4] - seq[3]],
        explanation: `Elke term is de som van de twee vorige. ${seq[3]} + ${seq[4]} = ${correct}.`,
      };
    },
    // Toenemende stap (tweede-orde verschil)
    function increasingStep() {
      const start = randInt(1, 8);
      let step = randInt(1, 4);
      const inc = pick([1, 2, 3]);
      const seq = [start];
      const steps = [];
      for (let i = 1; i < 6; i++) {
        steps.push(step);
        seq.push(seq[i - 1] + step);
        step += inc;
      }
      const correct = seq[5];
      return {
        seq,
        correct,
        candidates: [seq[4] + steps[3], correct + inc, correct - inc],
        explanation: `De sprongen worden steeds groter (+${inc} per keer): ${steps.join(", ")}. ${seq[4]} + ${steps[4]} = ${correct}.`,
      };
    },
    // Twee afwisselende reeksen (interleaved)
    function interleaved() {
      const a0 = randInt(1, 9);
      const b0 = randInt(1, 9);
      const sa = pick([2, 3, 4, 5]);
      const sb = pick([2, 3, 4, 5, -2]);
      const seq = [];
      for (let i = 0; i < 3; i++) {
        seq.push(a0 + i * sa);
        seq.push(b0 + i * sb);
      }
      const correct = a0 + 3 * sa; // volgende zou uit reeks A komen (index 6)
      // We tonen 6 termen (posities 0..5), ? is positie 6 => reeks A
      return {
        seq,
        correct,
        candidates: [b0 + 3 * sb, seq[4] + sa, correct + sa],
        explanation: `Twee verweven reeksen. Oneven posities: +${sa} (…, ${seq[4]}); even posities: +${sb}. De volgende hoort bij reeks A: ${seq[4]} + ${sa} = ${correct}.`,
      };
    },
    // Vermenigvuldig en tel op: n -> n*m + c
    function mulAdd() {
      const start = randInt(1, 4);
      const m = pick([2, 3]);
      const c = pick([1, 2, -1, 3]);
      const seq = [start];
      for (let i = 1; i < 6; i++) seq.push(seq[i - 1] * m + c);
      const correct = seq[5];
      return {
        seq,
        correct,
        candidates: [seq[4] * m, seq[4] * m + c + 1, seq[4] + seq[3]],
        explanation: `Regel: ×${m} ${c >= 0 ? "+ " + c : "- " + -c}. ${seq[4]} × ${m} ${c >= 0 ? "+ " + c : "- " + -c} = ${correct}.`,
      };
    },
    // Kwadraten (evt. met offset)
    function squares() {
      const off = pick([0, 0, 1, -1, 2]);
      const startN = randInt(1, 3);
      const seq = [];
      for (let i = 0; i < 6; i++) {
        const n = startN + i;
        seq.push(n * n + off);
      }
      const correct = seq[5];
      const lastN = startN + 5;
      return {
        seq,
        correct,
        candidates: [correct + (2 * lastN + 1), (lastN * lastN), correct - 1],
        explanation: `Kwadraten${off ? " (met " + (off > 0 ? "+" : "") + off + ")" : ""}: ${startN + 5}² ${off ? (off > 0 ? "+ " + off : "- " + -off) : ""} = ${correct}.`,
      };
    },
  ];

  function generateNumber() {
    const rule = pick(numberRules)();
    const prompt = rule.seq.slice(0, 5).map((v) => ({ text: String(v) }));
    prompt.push({ mystery: true });
    const built = buildNumberOptions(rule.correct, rule.candidates);
    return {
      type: "numbers",
      title: "Welk getal komt op de plaats van het vraagteken?",
      prompt,
      options: built.options,
      correctIndex: built.correctIndex,
      explanation: rule.explanation,
    };
  }

  /* ---------------- Letterreeksen ---------------- */
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function toLetter(n) {
    return ALPHA[((n % 26) + 26) % 26];
  }
  function idx(letter) {
    return ALPHA.indexOf(letter);
  }

  const letterRules = [
    // Vaste stap
    function constStep() {
      const start = randInt(0, 15);
      const step = pick([1, 2, 3, 4, -2, 5]);
      const seq = [];
      for (let i = 0; i < 6; i++) seq.push(start + i * step);
      return {
        seq,
        correctN: seq[5],
        explanation: `Steeds ${step > 0 ? step + " letter(s) vooruit" : -step + " letter(s) terug"} in het alfabet. Na ${toLetter(seq[4])} volgt ${toLetter(seq[5])}.`,
      };
    },
    // Toenemende stap
    function growStep() {
      const start = randInt(0, 10);
      let step = randInt(1, 3);
      const inc = pick([1, 2]);
      const seq = [start];
      for (let i = 1; i < 6; i++) {
        seq.push(seq[i - 1] + step);
        step += inc;
      }
      return {
        seq,
        correctN: seq[5],
        explanation: `De sprongen worden telkens ${inc} groter. ${toLetter(seq[4])} → ${toLetter(seq[5])}.`,
      };
    },
    // Afwisselende stap (bijv. +1, +3, +1, +3)
    function alternStep() {
      const start = randInt(0, 12);
      const s1 = pick([1, 2]);
      const s2 = pick([3, 4, 5]);
      const seq = [start];
      for (let i = 1; i < 6; i++) {
        seq.push(seq[i - 1] + (i % 2 === 1 ? s1 : s2));
      }
      return {
        seq,
        correctN: seq[5],
        explanation: `Afwisselend +${s1} en +${s2}. ${toLetter(seq[4])} → ${toLetter(seq[5])}.`,
      };
    },
  ];

  function buildLetterOptions(correctN) {
    const wrongs = new Set();
    const offsets = shuffle([1, 2, 3, -1, -2, -3, 4, -4]);
    let oi = 0;
    while (wrongs.size < 5) {
      const v = correctN + offsets[oi++ % offsets.length] + (oi > 8 ? randInt(-6, 6) : 0);
      const L = toLetter(v);
      if (L !== toLetter(correctN)) wrongs.add(L);
    }
    const correct = toLetter(correctN);
    const opts = shuffle(Array.from(wrongs).slice(0, 5).concat([correct]));
    return {
      options: opts.map((L) => ({ text: L })),
      correctIndex: opts.indexOf(correct),
    };
  }

  function generateLetter() {
    const rule = pick(letterRules)();
    const prompt = rule.seq.slice(0, 5).map((n) => ({ text: toLetter(n) }));
    prompt.push({ mystery: true });
    const built = buildLetterOptions(rule.correctN);
    return {
      type: "letters",
      title: "Welke letter komt op de plaats van het vraagteken?",
      prompt,
      options: built.options,
      correctIndex: built.correctIndex,
      explanation: rule.explanation,
    };
  }

  global.Sequences = { generateNumber, generateLetter, shuffle, randInt, pick };
})(window);
