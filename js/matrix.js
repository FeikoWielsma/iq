/* Abstracte matrices (Raven-stijl 3×3-raster). De rechteronderhoek is een
   vraagteken; kies de optie die het raster afmaakt, lezend van links naar
   rechts en van boven naar beneden. Drie regelsoorten (zoals assess.ly ze
   onderscheidt): rotatie, verplaatsing en aantal. */
(function (global) {
  "use strict";

  const S = global.Sequences;

  /* ---------- celinhoud ---------- */

  function arrow(cx, cy, angle) {
    // pijl van lengte ~34, gecentreerd, geroteerd (0° = naar rechts)
    return '<g transform="translate(' + cx + ',' + cy + ') rotate(' + angle + ')">' +
      '<line x1="-15" y1="0" x2="13" y2="0" stroke="#111" stroke-width="2.6"/>' +
      '<polyline points="6,-7 15,0 6,7" fill="none" stroke="#111" stroke-width="2.6" ' +
      'stroke-linejoin="round" stroke-linecap="round"/></g>';
  }

  // 8 randposities (met de klok mee vanaf linksboven), als offsets t.o.v. het midden
  const POS = [
    [-17, -17], [0, -17], [17, -17], [17, 0], [17, 17], [0, 17], [-17, 17], [-17, 0],
  ];
  function square(cx, cy, posIdx) {
    const [ox, oy] = POS[((posIdx % 8) + 8) % 8];
    const x = cx + ox - 7, y = cy + oy - 7;
    return '<rect x="' + x + '" y="' + y + '" width="14" height="14" fill="#fff" ' +
      'stroke="#111" stroke-width="2.4"/>';
  }

  const CDOTS = [
    [], [[0, 0]], [[-9, 0], [9, 0]], [[-10, 7], [0, -9], [10, 7]],
    [[-9, -9], [9, -9], [-9, 9], [9, 9]],
    [[-9, -9], [9, -9], [0, 0], [-9, 9], [9, 9]],
    [[-10, -9], [10, -9], [-10, 0], [10, 0], [-10, 9], [10, 9]],
  ];
  function dots(cx, cy, n) {
    return CDOTS[n].map(([ox, oy]) =>
      '<circle cx="' + (cx + ox) + '" cy="' + (cy + oy) + '" r="3.4" fill="#111"/>').join("");
  }

  function inner(spec, cx, cy) {
    if (spec.mystery) return '<text x="' + cx + '" y="' + (cy + 11) + '" font-size="30" ' +
      'font-weight="700" text-anchor="middle" fill="#111">?</text>';
    if (spec.kind === "arrow") return arrow(cx, cy, spec.angle);
    if (spec.kind === "square") return square(cx, cy, spec.pos);
    return dots(cx, cy, spec.n);
  }

  /* ---------- rendering ---------- */

  function gridSVG(specs) {
    const cell = 62, grid = [];
    for (let i = 1; i < 3; i++) {
      grid.push('<line x1="' + i * cell + '" y1="0" x2="' + i * cell + '" y2="186" stroke="#888" stroke-width="1.3"/>');
      grid.push('<line x1="0" y1="' + i * cell + '" x2="186" y2="' + i * cell + '" stroke="#888" stroke-width="1.3"/>');
    }
    let body = "";
    specs.forEach((spec, i) => {
      const cx = (i % 3) * cell + 31, cy = Math.floor(i / 3) * cell + 31;
      body += inner(spec, cx, cy);
    });
    return '<svg viewBox="0 0 186 186" width="186" height="186" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="1" y="1" width="184" height="184" fill="#fff" stroke="#111" stroke-width="2"/>' +
      grid.join("") + body + "</svg>";
  }

  function optionSVG(spec) {
    return '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="2" y="2" width="60" height="60" rx="6" fill="#fff" stroke="#111" stroke-width="2"/>' +
      inner(spec, 32, 32) + "</svg>";
  }

  /* ---------- optiebouwer ---------- */

  function buildOptions(correct, cands, keyOf) {
    const ck = keyOf(correct);
    const seen = new Set([ck]);
    const wrongs = [];
    for (const c of S.shuffle(cands)) {
      const k = keyOf(c);
      if (!seen.has(k)) { seen.add(k); wrongs.push(c); }
      if (wrongs.length >= 5) break;
    }
    const all = S.shuffle(wrongs.concat([correct]));
    return {
      options: all.map((s) => ({ svg: optionSVG(s) })),
      correctIndex: all.findIndex((s) => keyOf(s) === ck),
    };
  }

  function finish(subtype, specs, correct, built, explanation) {
    const full = specs.slice(0, 8).concat([correct]);
    return {
      type: "matrix",
      ruleTag: "matrix:" + subtype,
      title: "Welke figuur komt op de plaats van het vraagteken?",
      prompt: [{ svg: gridSVG(specs), wide: true }],
      options: built.options,
      correctIndex: built.correctIndex,
      explanation,
      solution: {
        note: "Het volledige raster:",
        cells: [{ svg: gridSVG(full), wide: true }],
      },
    };
  }

  /* ---------- 1. Rotatie ---------- */
  function genRotation() {
    const step = S.pick([45, 90, -45, -90]);
    const base = S.pick([0, 45, 90, 135, 180, 225, 270, 315]);
    const norm = (a) => (((Math.round(a / 5) * 5) % 360) + 360) % 360;
    const specs = [];
    for (let i = 0; i < 8; i++) specs.push({ kind: "arrow", angle: base + i * step });
    specs.push({ mystery: true });
    const correct = { kind: "arrow", angle: base + 8 * step };
    // offsets zijn allemaal onderling verschillend mod 360 en ≠ 0 → 7 unieke afleiders
    const cands = [45, 315, 90, 270, 135, 180, 225].map((d) =>
      ({ kind: "arrow", angle: correct.angle + d }));
    const built = buildOptions(correct, cands, (s) => "a" + norm(s.angle));
    const dir = step > 0 ? "met de klok mee" : "tegen de klok in";
    return finish("rotation", specs, correct, built,
      "De pijl draait elke stap " + Math.abs(step) + "° " + dir +
      " (van linksboven naar rechtsonder doorlezend).");
  }

  /* ---------- 2. Verplaatsing ---------- */
  function genMovement() {
    const step = S.pick([1, 2, -1]);
    const start = S.randInt(0, 7);
    const specs = [];
    for (let i = 0; i < 8; i++) specs.push({ kind: "square", pos: start + i * step });
    specs.push({ mystery: true });
    const correct = { kind: "square", pos: start + 8 * step };
    const key = (s) => "s" + ((((s.pos % 8) + 8) % 8));
    // alle overige 7 randposities → gegarandeerd 7 unieke afleiders
    const cands = [1, 2, 3, 4, 5, 6, 7].map((d) => ({ kind: "square", pos: correct.pos + d }));
    const built = buildOptions(correct, cands, key);
    const dir = step > 0 ? "met de klok mee" : "tegen de klok in";
    const amt = Math.abs(step) === 1 ? "één plek" : Math.abs(step) + " plekken";
    return finish("movement", specs, correct, built,
      "Het vierkantje schuift elke stap " + amt + " " + dir +
      " langs de rand van het vak.");
  }

  /* ---------- 3. Aantal ---------- */
  function genCount() {
    // aantal = rijstart + rij + kolom → neemt zowel naar rechts als naar beneden toe
    const rowStart = S.randInt(1, 2);
    const val = (r, c) => rowStart + r + c;
    const specs = [];
    for (let i = 0; i < 8; i++) specs.push({ kind: "dots", n: val(Math.floor(i / 3), i % 3) });
    specs.push({ mystery: true });
    const correct = { kind: "dots", n: val(2, 2) }; // rowStart(1..2)+2+2 = 5 of 6
    const key = (s) => "d" + s.n;
    // 1..6 behalve het juiste aantal → precies 5 plausibele afleiders
    const cands = [1, 2, 3, 4, 5, 6].filter((n) => n !== correct.n).map((n) => ({ kind: "dots", n }));
    const built = buildOptions(correct, cands, key);
    return finish("count", specs, correct, built,
      "Het aantal stippen neemt met 1 toe naar rechts én met 1 naar beneden; " +
      "rechtsonder zijn het er dus " + correct.n + ".");
  }

  function generate(difficulty) {
    const diff = difficulty || 2;
    let q;
    if (diff === 1) q = S.pick([genRotation, genCount])();
    else q = S.pick([genRotation, genMovement, genCount])();
    q.difficulty = diff;
    return q;
  }

  global.Matrix = { generate, genRotation, genMovement, genCount };
})(window);
