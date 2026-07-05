/* Pijlen & stippen (zoals Sanders voorbeeld): elke figuur heeft een pijl
   (links/rechts, open/dicht) plus een aantal stippen. In een reeks lopen
   meestal het aantal stippen én de pijlvulling/-richting volgens een regel. */
(function (global) {
  "use strict";

  const S = global.Sequences;

  // stipposities (−1..1) in het onderste vak, geschaald naar een straal
  const DOTS = [
    [],
    [[0, 0]],
    [[-0.6, 0], [0.6, 0]],
    [[-0.7, 0.4], [0, -0.45], [0.7, 0.4]],
    [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]],
    [[-0.6, -0.5], [0.6, -0.5], [0, 0], [-0.6, 0.5], [0.6, 0.5]],
  ];

  function arrowSVG(fig) {
    const arrowFill = fig.fill ? "#111" : "#fff"; // dicht vs open
    // naar rechts wijzende pijl; links = spiegelen om x = 32
    const pts = "15,17 33,17 33,12 48,20 33,28 33,23 15,23";
    const arrow =
      '<polygon points="' + pts + '" fill="' + arrowFill +
      '" stroke="#111" stroke-width="2" stroke-linejoin="round"' +
      (fig.dir === "left" ? ' transform="translate(64,0) scale(-1,1)"' : "") +
      "/>";
    const cxD = 32, cyD = 45, rD = 11;
    const dots = DOTS[fig.dots]
      .map(([nx, ny]) =>
        '<circle cx="' + (cxD + nx * rD).toFixed(1) + '" cy="' + (cyD + ny * rD).toFixed(1) +
        '" r="2.7" fill="#111"/>')
      .join("");
    return (
      '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="2" y="2" width="60" height="60" rx="8" fill="#fff" stroke="#111" stroke-width="2"/>' +
      arrow + dots + "</svg>"
    );
  }

  function keyOf(f) {
    return f.dir + "|" + (f.fill ? 1 : 0) + "|" + f.dots;
  }
  function clone(f) {
    return { dir: f.dir, fill: f.fill, dots: f.dots };
  }

  function perturbations(f) {
    const out = [];
    const push = (g) => { g.dots = Math.min(5, Math.max(0, g.dots)); out.push(g); };
    let g;
    g = clone(f); g.dots += 1; push(g);
    g = clone(f); g.dots -= 1; push(g);
    g = clone(f); g.fill = !g.fill; push(g);
    g = clone(f); g.dir = g.dir === "left" ? "right" : "left"; push(g);
    g = clone(f); g.dots += 2; push(g);
    g = clone(f); g.fill = !g.fill; g.dots -= 1; push(g);
    g = clone(f); g.dir = g.dir === "left" ? "right" : "left"; g.dots += 1; push(g);
    return out;
  }

  function buildOptions(correct, n) {
    const ck = keyOf(correct);
    const seen = new Set([ck]);
    const wrongs = [];
    for (const p of S.shuffle(perturbations(correct))) {
      const k = keyOf(p);
      if (!seen.has(k)) { seen.add(k); wrongs.push(p); }
      if (wrongs.length >= n - 1) break;
    }
    while (wrongs.length < n - 1) {
      const g = { dir: S.pick(["left", "right"]), fill: Math.random() < 0.5, dots: S.randInt(0, 5) };
      const k = keyOf(g);
      if (!seen.has(k)) { seen.add(k); wrongs.push(g); }
    }
    const all = S.shuffle(wrongs.concat([correct]));
    return {
      options: all.map((f) => ({ svg: arrowSVG(f) })),
      correctIndex: all.findIndex((f) => keyOf(f) === ck),
    };
  }

  function generate(difficulty) {
    const diff = difficulty || 2;
    // altijd een stippen-regel + minstens één pijl-regel (vulling en/of richting)
    const dotsDown = Math.random() < 0.5;
    const dotStart = dotsDown ? S.pick([4, 5]) : S.pick([0, 1]);

    let useFill, useDir;
    if (diff === 1) {
      // makkelijk: stippen + precies één extra regel
      useFill = Math.random() < 0.5;
      useDir = !useFill;
    } else if (diff === 3) {
      // pittig: stippen + vulling + richting, alle drie
      useFill = true;
      useDir = true;
    } else {
      useFill = Math.random() < 0.75;
      useDir = !useFill || Math.random() < 0.5; // minstens één van beide
    }
    const fill0 = Math.random() < 0.5;
    const dir0 = S.pick(["left", "right"]);

    const ruleTexts = [dotsDown ? "het aantal stippen neemt af" : "het aantal stippen neemt toe"];
    if (useFill) ruleTexts.push("de pijl wisselt om en om tussen open en dicht");
    if (useDir) ruleTexts.push("de pijl wisselt om en om van richting");

    const figs = [];
    for (let i = 0; i < 5; i++) {
      figs.push({
        dots: dotsDown ? dotStart - i : dotStart + i,
        fill: useFill ? (i % 2 === 0) === fill0 : fill0,
        dir: useDir ? (i % 2 === 0 ? dir0 : (dir0 === "left" ? "right" : "left")) : dir0,
      });
    }

    const prompt = figs.slice(0, 4).map((f) => ({ svg: arrowSVG(f) }));
    prompt.push({ mystery: true });

    const built = buildOptions(figs[4], 5);
    const tag = ["dots", useFill ? "fill" : null, useDir ? "dir" : null].filter(Boolean).join("+");
    return {
      type: "arrows",
      ruleTag: "arrows:" + tag,
      difficulty: diff,
      title: "Welke figuur komt op de plaats van het vraagteken?",
      prompt,
      options: built.options,
      correctIndex: built.correctIndex,
      explanation: "Regel: " + ruleTexts.join(" én ") + ".",
      solution: {
        note: "De volledige reeks — het laatste vak is het antwoord:",
        cells: figs.map((f, i) => ({ svg: arrowSVG(f), answer: i === 4 })),
      },
    };
  }

  global.Arrows = { generate };
})(window);
