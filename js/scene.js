/* Gekleurde composities (zoals de drukke figuurreeks-voorbeelden): een vak met
   een schuine scheidslijn, een grote ster en een rij kleine gekleurde vijfhoeken.
   Meerdere dingen veranderen tegelijk volgens een vaste regel:
   - de scheidslijn draait elke stap een vaste hoek;
   - de grote ster wisselt van kleur in een vast patroon;
   - (vanaf niveau 2) het aantal kleine vijfhoeken neemt toe of af.
   Anders dan een echte weegschaal is het antwoord altijd uniek bepaald: elke
   afleider is één attribuut één stap fout. */
(function (global) {
  "use strict";

  const S = global.Sequences;

  const PAL = [
    { hex: "#e0384d", name: "rood" }, { hex: "#3b82c4", name: "blauw" },
    { hex: "#3f9e54", name: "groen" }, { hex: "#d9a441", name: "geel" },
    { hex: "#9061c2", name: "paars" },
  ];
  const cname = (h) => (PAL.find((p) => p.hex === h) || {}).name || "grijs";

  function starPts(cx, cy, r) {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.44 : r;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      p.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1));
    }
    return p.join(" ");
  }
  function pentaPts(cx, cy, r) {
    const p = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      p.push((cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1));
    }
    return p.join(" ");
  }

  // vaste posities voor 1..5 kleine vijfhoeken (bovenin het vak)
  const SMALL_POS = [
    [], [[16, 15]], [[14, 14], [30, 15]], [[13, 13], [27, 13], [41, 15]],
    [[13, 13], [27, 13], [41, 14], [20, 26]], [[13, 13], [27, 13], [41, 14], [18, 26], [34, 27]],
  ];

  function draw(f) {
    const a = (f.angle * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
    const line = '<line x1="' + (32 - 40 * dx).toFixed(1) + '" y1="' + (32 - 40 * dy).toFixed(1) +
      '" x2="' + (32 + 40 * dx).toFixed(1) + '" y2="' + (32 + 40 * dy).toFixed(1) +
      '" stroke="#111" stroke-width="2"/>';
    let small = "";
    SMALL_POS[f.count].forEach(([x, y]) =>
      (small += '<polygon points="' + pentaPts(x, y, 5) + '" fill="' + f.smallColor +
        '" stroke="#111" stroke-width="1"/>'));
    return '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><clipPath id="scl"><rect x="3" y="3" width="58" height="58" rx="7"/></clipPath></defs>' +
      '<rect x="2" y="2" width="60" height="60" rx="8" fill="#fff" stroke="#111" stroke-width="2"/>' +
      '<g clip-path="url(#scl)">' + line + "</g>" +
      '<polygon points="' + starPts(38, 40, 13) + '" fill="' + f.bigColor + '" stroke="#111" stroke-width="1.5"/>' +
      small + "</svg>";
  }

  const nrm = (x) => ((Math.round(x) % 180) + 180) % 180; // lijn is symmetrisch onder 180°
  const keyOf = (f) => nrm(f.angle) + "|" + f.bigColor + "|" + f.count;

  function generate(difficulty) {
    const diff = difficulty || 2;
    const lineStep = S.pick([30, 45, -30, -45]);
    const line0 = S.pick([0, 30, 45, 60, 90, 120, 135, 150]);
    const k = S.pick([2, 3]);
    const cyc = S.shuffle(PAL.map((p) => p.hex)).slice(0, k);
    const smallColor = S.pick(PAL.map((p) => p.hex).filter((h) => !cyc.includes(h)).concat([cyc[0]]));
    const useCount = diff >= 2;
    const down = Math.random() < 0.5;
    const count0 = useCount ? (down ? 5 : 1) : 2;
    const countAt = (i) => (useCount ? (down ? count0 - i : count0 + i) : 2);

    const frame = (i) => ({ angle: line0 + i * lineStep, bigColor: cyc[i % k], count: countAt(i), smallColor });
    const figs = [];
    for (let i = 0; i < 5; i++) figs.push(frame(i));

    const prompt = figs.slice(0, 4).map((f) => ({ svg: draw(f) }));
    prompt.push({ mystery: true });

    const c = figs[4];
    const otherCols = PAL.map((p) => p.hex).filter((h) => h !== c.bigColor);
    const cand = [
      { angle: c.angle + lineStep, bigColor: c.bigColor, count: c.count, smallColor },
      { angle: c.angle - lineStep, bigColor: c.bigColor, count: c.count, smallColor },
      { angle: c.angle + 2 * lineStep, bigColor: c.bigColor, count: c.count, smallColor },
      { angle: c.angle, bigColor: otherCols[0], count: c.count, smallColor },
      { angle: c.angle, bigColor: otherCols[1], count: c.count, smallColor },
    ];
    if (useCount) {
      if (c.count < 5) cand.push({ angle: c.angle, bigColor: c.bigColor, count: c.count + 1, smallColor });
      if (c.count > 1) cand.push({ angle: c.angle, bigColor: c.bigColor, count: c.count - 1, smallColor });
    }

    const ck = keyOf(c);
    const seen = new Set([ck]);
    const wrongs = [];
    for (const w of S.shuffle(cand)) {
      const key = keyOf(w);
      if (!seen.has(key)) { seen.add(key); wrongs.push(w); }
      if (wrongs.length >= 4) break;
    }

    const all = S.shuffle(wrongs.concat([c]));
    const dir = lineStep > 0 ? "met de klok mee" : "tegen de klok in";
    const rules = ["de scheidslijn draait elke stap " + Math.abs(lineStep) + "° " + dir,
      "de grote ster wisselt van kleur in een vast patroon (" + cyc.map(cname).join(" → ") + ")"];
    if (useCount) rules.push("het aantal kleine vijfhoeken neemt elke stap met 1 " + (down ? "af" : "toe"));

    return {
      type: "scene",
      ruleTag: "scene:" + (useCount ? "line+color+count" : "line+color"),
      difficulty: diff,
      title: "Welke figuur komt op de plaats van het vraagteken?",
      prompt,
      options: all.map((f) => ({ svg: draw(f) })),
      correctIndex: all.findIndex((f) => keyOf(f) === ck),
      explanation: "Regel: " + rules.join("; ") + ".",
      solution: {
        note: "De volledige reeks — het laatste vak is het antwoord:",
        cells: figs.map((f, i) => ({ svg: draw(f), answer: i === 4 })),
      },
    };
  }

  global.Scene = { generate };
})(window);
