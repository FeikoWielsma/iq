/* Samengestelde figuur op één object: een pijl die per stap draait én er komt
   telkens één streepje (telmarkering) langs de schacht bij. Op het pittigste
   niveau wisselt bovendien de kleur om en om. Twee regels op hetzelfde object —
   lastiger te ontwarren dan twee losse objecten. */
(function (global) {
  "use strict";

  const S = global.Sequences;
  const COLORS = { "#111": "zwart", "#e0384d": "rood", "#3b82c4": "blauw" };

  function drawFused(f) {
    const a = (f.angle * Math.PI) / 180;
    const dx = Math.cos(a), dy = Math.sin(a);
    const px = Math.cos(a + Math.PI / 2), py = Math.sin(a + Math.PI / 2);
    const col = f.color || "#111";
    const P = (mx, my) => mx.toFixed(1) + "," + my.toFixed(1);
    const tipx = 32 + 21 * dx, tipy = 32 + 21 * dy;
    const tailx = 32 - 21 * dx, taily = 32 - 21 * dy;
    let body =
      '<line x1="' + tailx.toFixed(1) + '" y1="' + taily.toFixed(1) + '" x2="' +
      tipx.toFixed(1) + '" y2="' + tipy.toFixed(1) + '" stroke="' + col + '" stroke-width="2.6"/>';
    // pijlpunt
    const bx = 32 + 13 * dx, by = 32 + 13 * dy;
    body += '<polyline points="' + P(bx + 5 * px, by + 5 * py) + " " + P(tipx, tipy) + " " +
      P(bx - 5 * px, by - 5 * py) + '" fill="none" stroke="' + col +
      '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>';
    // telstreepjes dwars op de schacht
    for (let i = 0; i < f.n; i++) {
      const t = f.n === 1 ? 0 : -11 + (22 * i) / (f.n - 1);
      const mx = 32 + t * dx, my = 32 + t * dy;
      body += '<line x1="' + (mx - 6 * px).toFixed(1) + '" y1="' + (my - 6 * py).toFixed(1) +
        '" x2="' + (mx + 6 * px).toFixed(1) + '" y2="' + (my + 6 * py).toFixed(1) +
        '" stroke="' + col + '" stroke-width="2.2"/>';
    }
    return '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="2" y="2" width="60" height="60" rx="8" fill="#fff" stroke="#111" stroke-width="2"/>' +
      body + "</svg>";
  }

  const norm = (a) => (((a % 360) + 360) % 360);
  const clampN = (n) => Math.min(6, Math.max(0, n));
  function keyOf(f) { return norm(f.angle) + "|" + f.n + "|" + f.color; }

  function generate(difficulty) {
    const diff = difficulty || 2;
    const step = S.pick([30, 45, -30, -45]);
    const base = S.pick([0, 30, 45, 60, 90, 135, 150, 180, 225, 270, 315]);
    const nStart = S.pick([1, 2]);
    const useColor = diff === 3;
    const cyc = S.shuffle(["#e0384d", "#3b82c4", "#111"]).slice(0, 2);
    const colAt = (i) => (useColor ? cyc[i % 2] : "#111");

    const figs = [];
    for (let i = 0; i < 5; i++) figs.push({ angle: base + i * step, n: nStart + i, color: colAt(i) });

    const prompt = figs.slice(0, 4).map((f) => ({ svg: drawFused(f) }));
    prompt.push({ mystery: true });

    const c = figs[4];
    const other = cyc[0] === c.color ? cyc[1] : cyc[0];
    const cands = [
      { angle: c.angle, n: clampN(c.n + 1), color: c.color },
      { angle: c.angle, n: clampN(c.n - 1), color: c.color },
      { angle: c.angle + step, n: c.n, color: c.color },
      { angle: c.angle - step, n: c.n, color: c.color },
      { angle: c.angle + 180, n: c.n, color: c.color },
      { angle: c.angle - 2 * step, n: clampN(c.n - 1), color: c.color },
      { angle: c.angle, n: c.n, color: useColor ? other : (c.color === "#111" ? "#e0384d" : "#111") },
    ];

    const ck = keyOf(c);
    const seen = new Set([ck]);
    const wrongs = [];
    for (const cand of cands) {
      const k = keyOf(cand);
      if (!seen.has(k)) { seen.add(k); wrongs.push(cand); }
      if (wrongs.length >= 4) break;
    }
    let extra = 60;
    while (wrongs.length < 4) {
      const cand = { angle: c.angle + extra, n: c.n, color: c.color };
      const k = keyOf(cand);
      if (!seen.has(k)) { seen.add(k); wrongs.push(cand); }
      extra += 45;
    }

    const all = S.shuffle(wrongs.concat([c]));
    const dir = step > 0 ? "met de klok mee" : "tegen de klok in";
    return {
      type: "fused",
      ruleTag: "fused:" + (useColor ? "rot+count+color" : "rot+count"),
      difficulty: diff,
      title: "Welke figuur komt op de plaats van het vraagteken?",
      prompt,
      options: all.map((f) => ({ svg: drawFused(f) })),
      correctIndex: all.findIndex((f) => keyOf(f) === ck),
      explanation: "De pijl draait elke stap " + Math.abs(step) + "° " + dir +
        " én er komt telkens één streepje bij" +
        (useColor ? ", en de kleur wisselt om en om (" + cyc.map((h) => COLORS[h]).join(" / ") + ")." : "."),
      solution: {
        note: "De volledige reeks — het laatste vak is het antwoord:",
        cells: figs.map((f, i) => ({ svg: drawFused(f), answer: i === 4 })),
      },
    };
  }

  global.Fused = { generate };
})(window);
