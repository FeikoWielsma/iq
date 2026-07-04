/* Verplaatsing van figuren: meerdere figuren die elk hun eigen route door het
   vak volgen (pendelen tussen hoeken, door het midden zakken, enz.). Lijkt op
   het eerste gezicht op een statische reeks, maar hier verplaatst alles.
   Je kiest de figuur waarin álle objecten op hun juiste volgende plek staan. */
(function (global) {
  "use strict";

  const S = global.Sequences;

  // 3×3 raster; celmiddelpunten
  const CX = [15, 32, 49], CY = [15, 32, 49];
  function cellXY(cell) { return [CX[cell % 3], CY[Math.floor(cell / 3)]]; }

  const KIND_NL = { circle: "cirkel", triangle: "driehoek", square: "vierkant", arrow: "pijl" };

  function drawObj(kind, x, y) {
    if (kind === "circle") return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#111"/>';
    if (kind === "triangle")
      return '<polygon points="' + x + "," + (y - 5) + " " + (x - 5) + "," + (y + 4) +
        " " + (x + 5) + "," + (y + 4) + '" fill="#111"/>';
    if (kind === "square")
      return '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="8" height="8" fill="#111"/>';
    // arrow (naar beneden)
    return '<g transform="translate(' + x + "," + y + ')">' +
      '<line x1="0" y1="-6" x2="0" y2="4" stroke="#111" stroke-width="1.8"/>' +
      '<polyline points="-3,0 0,4 3,0" fill="none" stroke="#111" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></g>';
  }

  function sceneSVG(map) {
    let body = "";
    map.forEach((o) => { const [x, y] = cellXY(o.cell); body += drawObj(o.kind, x, y); });
    return (
      '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="2" y="2" width="60" height="60" rx="8" fill="#fff" stroke="#111" stroke-width="2"/>' +
      body + "</svg>"
    );
  }

  // disjuncte routes → objecten botsen nooit op dezelfde cel
  const CYCLES = [
    { cycle: [0, 2], text: "pendelt tussen de twee bovenhoeken" },
    { cycle: [6, 8], text: "pendelt tussen de twee onderhoeken" },
    { cycle: [1, 4, 7], text: "zakt door het midden naar beneden en begint weer bovenaan" },
  ];

  function generate(difficulty) {
    const kinds = S.shuffle(["circle", "triangle", "square", "arrow"]).slice(0, 3);
    const defs = S.shuffle(CYCLES.slice());
    const objs = kinds.map((k, idx) => {
      const def = defs[idx];
      const start = S.randInt(0, def.cycle.length - 1);
      const cells = [];
      for (let i = 0; i < 5; i++) cells.push(def.cycle[(start + i) % def.cycle.length]);
      return { kind: k, cycle: def.cycle, cells, text: def.text };
    });

    const frameMap = (i) => objs.map((o) => ({ kind: o.kind, cell: o.cells[i] }));
    const sig = (m) => m.map((o) => o.kind + ":" + o.cell).join("|");

    const prompt = [0, 1, 2, 3].map((i) => ({ svg: sceneSVG(frameMap(i)) }));
    prompt.push({ mystery: true });

    const correctMap = frameMap(4);
    const optSeen = new Set([sig(correctMap)]);
    const wrongs = [];

    // per object een afleider: dat object op een verkeerde plek van zijn route
    for (let oi = 0; oi < objs.length && wrongs.length < 3; oi++) {
      const o = objs[oi];
      const alts = o.cycle.filter((c) => c !== o.cells[4]);
      if (!alts.length) continue;
      const m = correctMap.map((x) => ({ kind: x.kind, cell: x.cell }));
      m[oi].cell = S.pick(alts);
      const s = sig(m);
      if (!optSeen.has(s)) { optSeen.add(s); wrongs.push(m); }
    }
    // veiligheidsvulling
    let guard = 0;
    while (wrongs.length < 3 && guard++ < 60) {
      const oi = S.randInt(0, objs.length - 1);
      const alts = objs[oi].cycle.filter((c) => c !== correctMap[oi].cell);
      if (!alts.length) continue;
      const m = correctMap.map((x) => ({ kind: x.kind, cell: x.cell }));
      m[oi].cell = S.pick(alts);
      const s = sig(m);
      if (!optSeen.has(s)) { optSeen.add(s); wrongs.push(m); }
    }

    const all = S.shuffle(wrongs.concat([correctMap]));
    const options = all.map((m) => ({ svg: sceneSVG(m) }));
    const correctIndex = all.findIndex((m) => sig(m) === sig(correctMap));

    const routes = objs.map((o) => "de " + KIND_NL[o.kind] + " " + o.text).join("; ");
    return {
      type: "movement",
      ruleTag: "movement",
      difficulty: difficulty || 2,
      title: "Welke figuur komt op de plaats van het vraagteken?",
      prompt,
      options,
      correctIndex,
      explanation:
        "Elke figuur volgt een eigen route: " + routes +
        ". Alleen bij het juiste antwoord staan álle figuren op hun volgende plek.",
    };
  }

  global.Movement = { generate };
})(window);
