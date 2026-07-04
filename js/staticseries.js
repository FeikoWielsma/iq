/* Statische reeks: geen verandering ván figuur tót figuur, maar in ELKE figuur
   geldt dezelfde telrelatie. Bijv.: het aantal pijlen naar links = het aantal
   cirkels, en het aantal pijlen naar beneden = het aantal driehoeken.
   Je kiest de figuur die dezelfde relatie respecteert. (Zie assessment-voorbeeld.) */
(function (global) {
  "use strict";

  const S = global.Sequences;

  const DIR_ANGLE = { right: 0, down: 90, left: 180, up: 270 };
  const DIR_NL = { right: "rechts", down: "beneden", left: "links", up: "boven" };
  const SHAPE_NL = { circle: "cirkels", triangle: "driehoeken" };

  function drawArrow(x, y, dir) {
    return (
      '<g transform="translate(' + x + "," + y + ") rotate(" + DIR_ANGLE[dir] + ')">' +
      '<line x1="-6" y1="0" x2="4" y2="0" stroke="#111" stroke-width="1.6"/>' +
      '<polyline points="0,-4 5,0 0,4" fill="none" stroke="#111" stroke-width="1.6" ' +
      'stroke-linejoin="round" stroke-linecap="round"/>' +
      "</g>"
    );
  }
  function drawShape(x, y, shape) {
    if (shape === "circle") return '<circle cx="' + x + '" cy="' + y + '" r="3.2" fill="#111"/>';
    return '<polygon points="' + x + "," + (y - 4.5) + " " + (x - 4.5) + "," + (y + 3.5) +
      " " + (x + 4.5) + "," + (y + 3.5) + '" fill="#111"/>';
  }

  // rasterposities zodat objecten elkaar niet overlappen
  const GRID = [];
  for (const gy of [14, 26, 38, 50]) for (const gx of [14, 26, 38, 50]) GRID.push([gx, gy]);

  function makeObjs(c, dir1, dir2, shape1, shape2) {
    const objs = [];
    for (let i = 0; i < c.a1; i++) objs.push({ kind: "arrow", dir: dir1 });
    for (let i = 0; i < c.a2; i++) objs.push({ kind: "arrow", dir: dir2 });
    for (let i = 0; i < c.s1; i++) objs.push({ kind: "shape", shape: shape1 });
    for (let i = 0; i < c.s2; i++) objs.push({ kind: "shape", shape: shape2 });
    return objs;
  }

  function frameSVG(objs) {
    const pos = S.shuffle(GRID.slice()).slice(0, objs.length);
    let body = "";
    objs.forEach((o, i) => {
      const [x, y] = pos[i];
      body += o.kind === "arrow" ? drawArrow(x, y, o.dir) : drawShape(x, y, o.shape);
    });
    return (
      '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="2" y="2" width="60" height="60" rx="8" fill="#fff" stroke="#111" stroke-width="2"/>' +
      body + "</svg>"
    );
  }

  function sig(c) { return c.a1 + "," + c.a2 + "," + c.s1 + "," + c.s2; }
  function valid(c) { return c.a1 === c.s1 && c.a2 === c.s2; }
  function randValid() {
    const a1 = S.randInt(1, 3), a2 = S.randInt(1, 3);
    return { a1, a2, s1: a1, s2: a2 };
  }

  function generate(difficulty) {
    const [dir1, dir2] = S.shuffle(["left", "down", "up", "right"]).slice(0, 2);
    const [shape1, shape2] = S.shuffle(["circle", "triangle"]);

    // 4 getoonde figuren, alle geldig en met verschillende telling
    const shown = [];
    const seen = new Set();
    while (shown.length < 4) {
      const c = randValid();
      if (!seen.has(sig(c))) { seen.add(sig(c)); shown.push(c); }
    }

    let correct;
    do { correct = randValid(); } while (seen.has(sig(correct)));
    const optSeen = new Set([sig(correct)]);

    // afleiders: precies één telrelatie klopt niet (±1)
    const wrongs = [];
    let guard = 0;
    while (wrongs.length < 3 && guard++ < 300) {
      const c = randValid();
      if (Math.random() < 0.5) c.s1 = Math.max(0, c.a1 + S.pick([1, -1]));
      else c.s2 = Math.max(0, c.a2 + S.pick([1, -1]));
      if (valid(c)) continue;
      const k = sig(c);
      if (optSeen.has(k)) continue;
      optSeen.add(k);
      wrongs.push(c);
    }

    const prompt = shown.map((c) => ({ svg: frameSVG(makeObjs(c, dir1, dir2, shape1, shape2)) }));
    prompt.push({ mystery: true });

    const all = S.shuffle(wrongs.concat([correct]));
    const options = all.map((c) => ({ svg: frameSVG(makeObjs(c, dir1, dir2, shape1, shape2)) }));
    const correctIndex = all.findIndex((c) => sig(c) === sig(correct));

    return {
      type: "staticseries",
      ruleTag: "staticseries",
      difficulty: difficulty || 2,
      title: "Welke figuur past in deze (statische) reeks?",
      prompt,
      options,
      correctIndex,
      explanation:
        "Statische reeks: er verandert niets ván figuur tót figuur. In élke figuur is " +
        "het aantal pijlen naar " + DIR_NL[dir1] + " gelijk aan het aantal " + SHAPE_NL[shape1] +
        ", en het aantal pijlen naar " + DIR_NL[dir2] + " gelijk aan het aantal " +
        SHAPE_NL[shape2] + ". Alleen het juiste antwoord klopt op beide.",
    };
  }

  global.StaticSeries = { generate };
})(window);
