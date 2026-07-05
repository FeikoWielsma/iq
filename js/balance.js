/* Weegschaal / balans (zoals de seesaw-voorbeelden). Een balk op een steunpunt
   met gewichtjes links en rechts. De balk tikt naar de zwaarste kant (of blijft
   in evenwicht bij gelijk gewicht). In de reeks verandert het aantal gewichtjes
   aan één kant per stap; jij kiest de balk die zowel de juiste aantallen als de
   juiste stand toont. De kernvaardigheid: de balk zakt aan de zwaarste kant. */
(function (global) {
  "use strict";

  const S = global.Sequences;

  // compacte clusterposities voor 0..6 gewichtjes (2 kolommen breed)
  const WLAYOUT = [
    [], [[0, 0]], [[-4, 0], [4, 0]], [[-4, -4], [4, -4], [0, 4]],
    [[-4, -4], [4, -4], [-4, 4], [4, 4]],
    [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]],
    [[-4, -5], [4, -5], [-4, 0], [4, 0], [-4, 5], [4, 5]],
  ];

  function weights(ex, ey, n, color) {
    const cx = ex, cy = ey - 10;
    return WLAYOUT[n].map(([ox, oy]) =>
      '<circle cx="' + (cx + ox).toFixed(1) + '" cy="' + (cy + oy).toFixed(1) +
      '" r="2.7" fill="' + color + '" stroke="#111" stroke-width="0.8"/>').join("");
  }

  function drawBalance(o) {
    const tilt = (o.sign * 14 * Math.PI) / 180; // + = rechts zakt
    const cos = Math.cos(tilt), sin = Math.sin(tilt);
    const px = 32, py = 44, HALF = 21;
    const lx = px - HALF * cos, ly = py - HALF * sin;
    const rx = px + HALF * cos, ry = py + HALF * sin;
    let body = '<polygon points="' + px + "," + py + " " + (px - 6) + "," + (py + 13) +
      " " + (px + 6) + "," + (py + 13) + '" fill="#111"/>';
    body += '<line x1="' + lx.toFixed(1) + '" y1="' + ly.toFixed(1) + '" x2="' + rx.toFixed(1) +
      '" y2="' + ry.toFixed(1) + '" stroke="#111" stroke-width="3" stroke-linecap="round"/>';
    body += weights(lx, ly, o.L, o.lc) + weights(rx, ry, o.R, o.rc);
    return '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="2" y="2" width="60" height="60" rx="8" fill="#fff" stroke="#111" stroke-width="2"/>' +
      body + "</svg>";
  }

  const sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
  function keyOf(o) { return o.R + "|" + o.sign; } // L is constant per vraag

  function generate(difficulty) {
    const diff = difficulty || 2;
    const L = S.pick([2, 3]);
    const rStart = S.pick([1, 2]);
    const cols = S.shuffle(["#e0384d", "#3b82c4", "#3f9e54"]).slice(0, 2);
    const lc = cols[0], rc = cols[1];
    const mk = (R) => ({ L, R, sign: sgn(R - L), lc, rc });

    const figs = [];
    for (let i = 0; i < 5; i++) figs.push(mk(rStart + i));

    const prompt = figs.slice(0, 4).map((f) => ({ svg: drawBalance(f) }));
    prompt.push({ mystery: true });

    const c = figs[4]; // R5 = rStart+4 (5 of 6) > L → tikt naar rechts
    const cand = [
      { L, R: c.R, sign: -1, lc, rc },           // verkeerde kant op
      { L, R: c.R, sign: 0, lc, rc },            // in evenwicht (klopt niet)
      mk(c.R - 1), mk(c.R + 1), mk(c.R - 2),     // verkeerd aantal, juiste stand
      { L, R: c.R - 1, sign: -1, lc, rc },       // verkeerd aantal én kant
    ];
    const ck = keyOf(c);
    const seen = new Set([ck]);
    const wrongs = [];
    for (const w of cand) {
      if (w.R < 0 || w.R > 6) continue;
      const k = keyOf(w);
      if (!seen.has(k)) { seen.add(k); wrongs.push(w); }
      if (wrongs.length >= 4) break;
    }
    let extra = 3;
    while (wrongs.length < 4) {
      const w = { L, R: Math.min(6, c.R + extra), sign: 1, lc, rc };
      const k = keyOf(w);
      if (!seen.has(k)) { seen.add(k); wrongs.push(w); }
      extra++;
      if (extra > 9) break;
    }

    const all = S.shuffle(wrongs.concat([c]));
    return {
      type: "balance",
      ruleTag: "balance",
      difficulty: diff,
      title: "Welke balans komt op de plaats van het vraagteken?",
      prompt,
      options: all.map((o) => ({ svg: drawBalance(o) })),
      correctIndex: all.findIndex((o) => keyOf(o) === ck),
      explanation:
        "De balk zakt altijd naar de zwaarste kant. Links liggen er steeds " + L +
        ", rechts komt er elke stap één bij; bij het vraagteken liggen er rechts " +
        c.R + " — dus zwaarder dan links, en de balk tikt naar rechts.",
      solution: {
        note: "De volledige reeks — het laatste vak is het antwoord:",
        cells: figs.map((f, i) => ({ svg: drawBalance(f), answer: i === 4 })),
      },
    };
  }

  global.Balance = { generate };
})(window);
