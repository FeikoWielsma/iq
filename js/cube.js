/* Kubus vouwen: uit een kruis-uitslag kies je de kubus die je er echt van kunt
   vouwen. Correctheid via een echt kubusmodel:
   - vlaknormalen bepalen welke 3 vlakken samen een hoek vormen;
   - de handedness (schroefzin) bepaalt of de weergave klopt of gespiegeld is.
   Afleiders: twee tegenoverliggende vlakken samen, gespiegelde hoek, of een
   vlak dat dubbel voorkomt. Alle drie zijn onvouwbaar.

   Vlakinhoud kan vier vormen aannemen: symbolen, gekleurde vlakken, halve
   vlakken of getallen. Bij de kubus wordt de inhoud met een affiene transform
   op de drie zichtbare vlakvlakken "gelegd", zodat het echt 3D oogt. De
   oriëntatie ín een vlak wordt niet getoetst (inhoud staat altijd recht), dus de
   grondwaarheid blijft zuiver: alleen welke vlakken samenkomen telt. */
(function (global) {
  "use strict";

  const S = global.Sequences;

  // referentie-oriëntatie: buitennormalen per vlaklabel
  const NORM = {
    U: [0, 0, 1], D: [0, 0, -1],
    F: [0, -1, 0], B: [0, 1, 0],
    R: [1, 0, 0], L: [-1, 0, 0],
  };
  const OPP = { U: "D", D: "U", F: "B", B: "F", R: "L", L: "R" };
  const LABELS = ["U", "D", "F", "B", "R", "L"];

  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  // -1 = echte hoek (top/front/right in standaard iso-aanzicht), +1 = gespiegeld
  function handed(t, f, r) { return dot(NORM[t], cross(NORM[r], NORM[f])); }

  function randValidCorner() {
    const t = S.pick(LABELS);
    const f = S.pick(LABELS.filter((l) => l !== t && l !== OPP[t]));
    const rPair = LABELS.filter((l) => l !== t && l !== OPP[t] && l !== f && l !== OPP[f]);
    const r = rPair.find((l) => handed(t, f, l) === -1);
    return { t, f, r };
  }

  /* ---------- inhoud: identiteitensets ---------- */
  const SYMBOL_POOL = ["disc", "ring", "square", "triangle", "star", "diamond"];
  const COLORS6 = ["#6bbf6b", "#6ba3d6", "#e8d36b", "#e6a0b8", "#e0a56b", "#a98fd0"];
  const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(Math.min(255, ((n >> 16) & 255) * f));
    const g = Math.round(Math.min(255, ((n >> 8) & 255) * f));
    const b = Math.round(Math.min(255, (n & 255) * f));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // symbool getekend rond de oorsprong (0,0), straal r
  function symbolLocal(sym, r, color) {
    const c = color || "#111";
    const sw = Math.max(1.5, r * 0.34);
    if (sym === "disc") return '<circle cx="0" cy="0" r="' + r.toFixed(1) + '" fill="' + c + '"/>';
    if (sym === "ring") return '<circle cx="0" cy="0" r="' + r.toFixed(1) + '" fill="none" stroke="' + c + '" stroke-width="' + sw.toFixed(1) + '"/>';
    if (sym === "square") { const h = r * 0.92; return '<rect x="' + (-h).toFixed(1) + '" y="' + (-h).toFixed(1) + '" width="' + (2 * h).toFixed(1) + '" height="' + (2 * h).toFixed(1) + '" fill="' + c + '"/>'; }
    if (sym === "triangle") return '<polygon points="0,' + (-r).toFixed(1) + " " + (-r * 0.92).toFixed(1) + "," + (r * 0.8).toFixed(1) + " " + (r * 0.92).toFixed(1) + "," + (r * 0.8).toFixed(1) + '" fill="' + c + '"/>';
    if (sym === "diamond") return '<polygon points="0,' + (-r).toFixed(1) + " " + (r * 0.8).toFixed(1) + ",0 0," + r.toFixed(1) + " " + (-r * 0.8).toFixed(1) + ',0" fill="' + c + '"/>';
    // star (5-punt)
    const p = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.44 : r;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      p.push((rr * Math.cos(a)).toFixed(1) + "," + (rr * Math.sin(a)).toFixed(1));
    }
    return '<polygon points="' + p.join(" ") + '" fill="' + c + '"/>';
  }

  function numberLocal(d, color) {
    return '<text x="0" y="0" font-size="15" text-anchor="middle" dominant-baseline="central" ' +
      'font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="' + (color || "#111") + '">' + d + "</text>";
  }

  // inhoud van één vlak, getekend rond de oorsprong (voor net via translate, voor
  // kubus via de vlak-matrix)
  function contentLocal(mode, id, r) {
    if (mode === "numbers") return numberLocal(id.num, "#111");
    if (mode === "symbols") return symbolLocal(id.sym, r, "#111");
    return ""; // kleuren/half: identiteit zit in de vlakvulling zelf
  }
  function idKey(id) { return id.sym || id.num || id.color; }

  function buildContent(mode) {
    const id = {};
    if (mode === "symbols") { const s = S.shuffle(SYMBOL_POOL.slice()); LABELS.forEach((l, i) => (id[l] = { sym: s[i] })); }
    else if (mode === "numbers") { const d = S.shuffle(DIGITS.slice()).slice(0, 6); LABELS.forEach((l, i) => (id[l] = { num: d[i] })); }
    else { const c = S.shuffle(COLORS6.slice()); LABELS.forEach((l, i) => (id[l] = { color: c[i] })); }
    return id;
  }

  /* ---------- kruis-uitslag (plat) ---------- */
  const NET_POS = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };
  function netSVG(mode, id) {
    const c = 30, m = 3;
    let body = "";
    for (const lab of LABELS) {
      const [col, row] = NET_POS[lab];
      const x = m + col * c, y = m + row * c;
      const cid = id[lab];
      const fill = (mode === "colors" || mode === "half") ? cid.color : "#fff";
      body += '<rect x="' + x + '" y="' + y + '" width="' + c + '" height="' + c + '" fill="' + fill + '" stroke="#111" stroke-width="2"/>';
      if (mode === "half") {
        // driehoekshelft in wit → "half vlak"
        body += '<polygon points="' + x + "," + y + " " + (x + c) + "," + (y + c) + " " + x + "," + (y + c) +
          '" fill="#fff" opacity="0.78"/>';
        body += '<rect x="' + x + '" y="' + y + '" width="' + c + '" height="' + c + '" fill="none" stroke="#111" stroke-width="2"/>';
      }
      const inner = contentLocal(mode, cid, 9);
      if (inner) body += '<g transform="translate(' + (x + c / 2) + "," + (y + c / 2) + ')">' + inner + "</g>";
    }
    const w = m * 2 + 4 * c, h = m * 2 + 3 * c;
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h +
      '" xmlns="http://www.w3.org/2000/svg">' + body + "</svg>";
  }

  /* ---------- isometrische kubus ---------- */
  // per zichtbaar vlak: middelpunt C, halve randvectoren bx/by, schaduwfactor, polygon
  const FACE = {
    top: { C: [32, 22], bx: [11, 6], by: [11, -6], shade: 1.0, poly: "32,10 54,22 32,34 10,22" },
    left: { C: [21, 40], bx: [11, 6], by: [0, 12], shade: 0.86, poly: "10,22 32,34 32,58 10,46" },
    right: { C: [43, 40], bx: [11, -6], by: [0, 12], shade: 0.72, poly: "54,22 32,34 32,58 54,46" },
  };
  function faceTF(face) {
    const F = FACE[face];
    return "matrix(" + (F.bx[0] / 10) + "," + (F.bx[1] / 10) + "," + (F.by[0] / 10) + "," +
      (F.by[1] / 10) + "," + F.C[0] + "," + F.C[1] + ")";
  }
  function cubeFace(face, mode, id) {
    const F = FACE[face];
    let fill;
    if (mode === "colors" || mode === "half") fill = shade(id.color, F.shade);
    else fill = shade("#fdfdfd", F.shade); // subtiele 3D-schaduw op witte vlakken
    let s = '<polygon points="' + F.poly + '" fill="' + fill + '" stroke="#111" stroke-width="2" stroke-linejoin="round"/>';
    if (mode === "half") {
      // halve vlak: witte driehoek diagonaal, meegevouwen met het vlak
      s += '<g transform="' + faceTF(face) + '"><polygon points="-10,-10 10,10 -10,10" fill="#ffffff" opacity="0.7"/></g>';
      s += '<polygon points="' + F.poly + '" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round"/>';
    }
    const inner = contentLocal(mode, id, 7);
    if (inner) s += '<g transform="' + faceTF(face) + '">' + inner + "</g>";
    return s;
  }
  function cubeSVG(o, mode, id) {
    return '<svg viewBox="0 0 64 68" width="64" height="68" xmlns="http://www.w3.org/2000/svg">' +
      cubeFace("top", mode, id[o.top]) +
      cubeFace("left", mode, id[o.left]) +
      cubeFace("right", mode, id[o.right]) +
      "</svg>";
  }

  // Is een getoonde kubus echt vouwbaar? (voor zelfcontrole/tests)
  function optionFoldable(o) {
    if (new Set([o.top, o.left, o.right]).size < 3) return false;      // vlak dubbel
    if (OPP[o.top] === o.left || OPP[o.top] === o.right || OPP[o.left] === o.right) return false; // tegenoverliggend
    return handed(o.top, o.left, o.right) === -1;                     // juiste draaizin
  }

  const MODE_NL = { symbols: "symbolen", colors: "gekleurde vlakken", half: "halve vlakken", numbers: "getallen" };

  function generate(difficulty) {
    const diff = difficulty || 2;
    let mode;
    if (diff === 1) mode = S.pick(["symbols", "numbers", "colors"]);
    else if (diff === 3) mode = S.pick(["symbols", "numbers", "colors", "half", "half"]);
    else mode = S.pick(["symbols", "numbers", "colors", "colors", "half"]);
    const id = buildContent(mode);

    const corner = randValidCorner();
    const correct = { top: corner.t, left: corner.f, right: corner.r };

    const key = (o) => o.top + "|" + o.left + "|" + o.right;
    const seen = new Set([key(correct)]);
    const wrongs = [];
    const push = (o) => { const k = key(o); if (!seen.has(k)) { seen.add(k); wrongs.push(o); } };

    // A: tegenoverliggend vlak getoond (voor + achter samen) → onmogelijk
    push({ top: corner.t, left: corner.f, right: OPP[corner.f] });
    // B: gespiegelde hoek (voor/rechts verwisseld) → handedness +1, onvouwbaar
    push({ top: corner.t, left: corner.r, right: corner.f });
    // C: vlak dubbel → onmogelijk
    push({ top: corner.t, left: corner.f, right: corner.t });
    // reserve
    push({ top: OPP[corner.t], left: corner.f, right: corner.r });

    const chosen = wrongs.slice(0, 3);
    const all = S.shuffle(chosen.concat([correct]));
    const options = all.map((o) => ({ svg: cubeSVG(o, mode, id) }));
    const correctIndex = all.findIndex((o) => key(o) === key(correct));

    const detail = mode === "numbers"
      ? "getallen die tegenover elkaar liggen zie je nooit samen"
      : mode === "colors" || mode === "half"
        ? "kleuren die tegenover elkaar liggen zie je nooit samen"
        : "symbolen die tegenover elkaar liggen zie je nooit samen";

    return {
      type: "cube",
      ruleTag: "cube:" + mode,
      difficulty: diff,
      title: "Welke kubus kun je van deze uitslag vouwen?",
      prompt: [{ svg: netSVG(mode, id), wide: true }],
      options,
      correctIndex,
      _audit: all.map((o) => optionFoldable(o)),
      explanation:
        "Vouw de kruis-uitslag in gedachten (inhoud: " + MODE_NL[mode] + "). Tegenoverliggende " +
        "vlakken (boven/onder, links/rechts, voor/achter) kun je nooit samen zien — " + detail +
        " — en de drie zichtbare vlakken moeten in de juiste draaizin staan. Alleen het juiste antwoord voldoet.",
    };
  }

  global.Cube = { generate };
})(window);
