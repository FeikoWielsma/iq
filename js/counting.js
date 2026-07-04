/* Aantallen tellen met afleiding (vermeerdering/vermindering van elementen).
   Elke figuur heeft één hoofdlijn die willekeurig draait — die draaiing is
   pure afleiding. Het patroon zit in het AANTAL dwarsstreepjes op de lijn,
   dat een reeks volgt (bijv. 1, 3, 2, 4 → 3). */
(function (global) {
  "use strict";

  const S = global.Sequences;

  // telpatronen; elk levert 5 waarden (4 getoond + antwoord), binnen 1..6
  const PATTERNS = [
    {
      text: "elke stap één streepje erbij",
      make: () => { const s = S.randInt(1, 2); return [0, 1, 2, 3, 4].map((i) => s + i); },
    },
    {
      text: "afwisselend twee erbij en één eraf",
      make: () => { const s = S.randInt(1, 2); const q = [s]; for (let i = 1; i < 5; i++) q.push(q[i - 1] + (i % 2 ? 2 : -1)); return q; },
    },
    {
      text: "afwisselend één eraf en twee erbij",
      make: () => { const s = S.randInt(4, 6); const q = [s]; for (let i = 1; i < 5; i++) q.push(q[i - 1] + (i % 2 ? -1 : 2)); return q; },
    },
    {
      text: "afwisselend één en twee erbij",
      make: () => { const s = S.randInt(1, 2); const q = [s]; for (let i = 1; i < 5; i++) q.push(q[i - 1] + (i % 2 ? 1 : 2)); return q; },
    },
  ];

  function countSeq() {
    for (let t = 0; t < 60; t++) {
      const p = S.pick(PATTERNS);
      const seq = p.make();
      if (seq.every((v) => v >= 1 && v <= 6)) return { seq, text: p.text };
    }
    return { seq: [1, 2, 3, 4, 5], text: "elke stap één streepje erbij" };
  }

  function frameSVG(count, angleDeg) {
    const a = (angleDeg * Math.PI) / 180;
    const dx = Math.cos(a), dy = Math.sin(a);
    const px = -dy, py = dx; // loodrecht op de lijn
    const half = 23;
    const line =
      '<line x1="' + (32 - half * dx).toFixed(1) + '" y1="' + (32 - half * dy).toFixed(1) +
      '" x2="' + (32 + half * dx).toFixed(1) + '" y2="' + (32 + half * dy).toFixed(1) +
      '" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>';
    const spacing = count > 1 ? Math.min(6.5, 22 / (count - 1)) : 0;
    let marks = "";
    for (let j = 0; j < count; j++) {
      const t = (j - (count - 1) / 2) * spacing;
      const cx = 32 + t * dx, cy = 32 + t * dy;
      const m = 5;
      marks +=
        '<line x1="' + (cx - px * m).toFixed(1) + '" y1="' + (cy - py * m).toFixed(1) +
        '" x2="' + (cx + px * m).toFixed(1) + '" y2="' + (cy + py * m).toFixed(1) +
        '" stroke="#111" stroke-width="1.8" stroke-linecap="round"/>';
    }
    return (
      '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="2" y="2" width="60" height="60" rx="8" fill="#fff" stroke="#111" stroke-width="2"/>' +
      line + marks + "</svg>"
    );
  }

  function generate(difficulty) {
    const { seq, text } = countSeq();
    const angle = () => S.randInt(10, 170); // willekeurige (afleidende) draaiing

    const prompt = seq.slice(0, 4).map((c) => ({ svg: frameSVG(c, angle()) }));
    prompt.push({ mystery: true });

    const correct = seq[4];
    // afleiders: andere aantallen (draaiing is toch irrelevant), dus uniek op aantal
    const cand = [correct + 1, correct - 1, correct + 2, correct - 2, correct + 3]
      .filter((v) => v >= 0 && v <= 8 && v !== correct);
    const counts = [];
    const seen = new Set([correct]);
    for (const v of S.shuffle(cand)) {
      if (!seen.has(v)) { seen.add(v); counts.push(v); }
      if (counts.length >= 4) break;
    }
    let extra = 4;
    while (counts.length < 4) { const v = correct + extra++; if (!seen.has(v) && v <= 10) { seen.add(v); counts.push(v); } }

    const all = S.shuffle(counts.concat([correct]));
    const options = all.map((c) => ({ svg: frameSVG(c, angle()) }));
    const correctIndex = all.indexOf(correct);

    return {
      type: "counting",
      ruleTag: "counting",
      difficulty: difficulty || 2,
      title: "Welke figuur komt op de plaats van het vraagteken?",
      prompt,
      options,
      correctIndex,
      explanation:
        "Let op: de draaiing van de lijn is afleiding — negeer die. Tel de dwarsstreepjes: " +
        text + ". Na " + seq[3] + " volgt " + correct + ".",
    };
  }

  global.Counting = { generate };
})(window);
