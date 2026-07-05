/* Kubus vouwen: uit een kruis-uitslag met 6 symbolen kies je de kubus die je
   er echt van kunt vouwen. Correctheid via een echt kubusmodel:
   - vlaknormalen bepalen welke 3 vlakken samen een hoek vormen;
   - de handedness (schroefzin) bepaalt of de weergave klopt of gespiegeld is.
   Afleiders: twee tegenoverliggende vlakken samen, gespiegelde hoek, of een
   symbool dat dubbel voorkomt. Alle drie zijn onvouwbaar. */
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

  /* ---------- symbolen (oriëntatie-vrij) ---------- */
  const SYMBOLS = ["circle", "ring", "square", "triangle", "plus", "ex"];
  function drawSymbol(sym, cx, cy, s) {
    const sw = Math.max(1.4, s * 0.3);
    if (sym === "circle") return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (s * 0.72).toFixed(1) + '" fill="#111"/>';
    if (sym === "ring") return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (s * 0.7).toFixed(1) + '" fill="none" stroke="#111" stroke-width="' + sw.toFixed(1) + '"/>';
    if (sym === "square") { const h = s * 0.68; return '<rect x="' + (cx - h).toFixed(1) + '" y="' + (cy - h).toFixed(1) + '" width="' + (2 * h).toFixed(1) + '" height="' + (2 * h).toFixed(1) + '" fill="#111"/>'; }
    if (sym === "triangle") return '<polygon points="' + cx + "," + (cy - s * 0.8).toFixed(1) + " " + (cx - s * 0.8).toFixed(1) + "," + (cy + s * 0.6).toFixed(1) + " " + (cx + s * 0.8).toFixed(1) + "," + (cy + s * 0.6).toFixed(1) + '" fill="#111"/>';
    if (sym === "plus") return '<line x1="' + (cx - s * 0.8).toFixed(1) + '" y1="' + cy + '" x2="' + (cx + s * 0.8).toFixed(1) + '" y2="' + cy + '" stroke="#111" stroke-width="' + sw.toFixed(1) + '"/>' +
      '<line x1="' + cx + '" y1="' + (cy - s * 0.8).toFixed(1) + '" x2="' + cx + '" y2="' + (cy + s * 0.8).toFixed(1) + '" stroke="#111" stroke-width="' + sw.toFixed(1) + '"/>';
    // ex (X)
    const d = s * 0.6;
    return '<line x1="' + (cx - d).toFixed(1) + '" y1="' + (cy - d).toFixed(1) + '" x2="' + (cx + d).toFixed(1) + '" y2="' + (cy + d).toFixed(1) + '" stroke="#111" stroke-width="' + sw.toFixed(1) + '"/>' +
      '<line x1="' + (cx - d).toFixed(1) + '" y1="' + (cy + d).toFixed(1) + '" x2="' + (cx + d).toFixed(1) + '" y2="' + (cy - d).toFixed(1) + '" stroke="#111" stroke-width="' + sw.toFixed(1) + '"/>';
  }

  /* ---------- kruis-uitslag ---------- */
  // posities (kolom,rij): U boven F; L F R B in het midden; D onder F
  const NET_POS = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };
  function netSVG(sym) {
    const c = 30, m = 3;
    let body = "";
    for (const lab of LABELS) {
      const [col, row] = NET_POS[lab];
      const x = m + col * c, y = m + row * c;
      body += '<rect x="' + x + '" y="' + y + '" width="' + c + '" height="' + c + '" fill="#fff" stroke="#111" stroke-width="2"/>';
      body += drawSymbol(sym[lab], x + c / 2, y + c / 2, 8);
    }
    const w = m * 2 + 4 * c, h = m * 2 + 3 * c;
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h +
      '" xmlns="http://www.w3.org/2000/svg">' + body + "</svg>";
  }

  /* ---------- isometrische kubus (top, links=front, rechts) ---------- */
  function cubeSVG(topSym, leftSym, rightSym) {
    const top = "32,10 54,22 32,34 10,22";
    const left = "10,22 32,34 32,58 10,46";
    const right = "54,22 32,34 32,58 54,46";
    return (
      '<svg viewBox="0 0 64 68" width="64" height="68" xmlns="http://www.w3.org/2000/svg">' +
      '<polygon points="' + top + '" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/>' +
      '<polygon points="' + left + '" fill="#f4f5f7" stroke="#111" stroke-width="2" stroke-linejoin="round"/>' +
      '<polygon points="' + right + '" fill="#e9ebee" stroke="#111" stroke-width="2" stroke-linejoin="round"/>' +
      drawSymbol(topSym, 32, 22, 6) +
      drawSymbol(leftSym, 21, 40, 6) +
      drawSymbol(rightSym, 43, 40, 6) +
      "</svg>"
    );
  }

  // Is een getoonde kubus echt vouwbaar? (voor zelfcontrole/tests)
  function optionFoldable(o, invSym) {
    if (new Set([o.top, o.left, o.right]).size < 3) return false; // symbool dubbel
    const lt = invSym[o.top], lf = invSym[o.left], lr = invSym[o.right];
    if (OPP[lt] === lf || OPP[lt] === lr || OPP[lf] === lr) return false; // tegenoverliggend
    return handed(lt, lf, lr) === -1; // juiste draaizin
  }

  function generate(difficulty) {
    // wijs 6 symbolen toe aan de 6 vlakken
    const syms = S.shuffle(SYMBOLS.slice());
    const sym = {};
    LABELS.forEach((l, i) => { sym[l] = syms[i]; });
    const invSym = {};
    LABELS.forEach((l) => { invSym[sym[l]] = l; });

    const corner = randValidCorner();
    const correct = { top: sym[corner.t], left: sym[corner.f], right: sym[corner.r] };

    const key = (o) => o.top + "|" + o.left + "|" + o.right;
    const seen = new Set([key(correct)]);
    const wrongs = [];
    const push = (o) => { const k = key(o); if (!seen.has(k)) { seen.add(k); wrongs.push(o); } };

    // A: tegenoverliggend vlak getoond (front + back samen) -> onmogelijk
    push({ top: sym[corner.t], left: sym[corner.f], right: sym[OPP[corner.f]] });
    // B: gespiegelde hoek (front/right verwisseld) -> handedness +1, onvouwbaar
    push({ top: sym[corner.t], left: sym[corner.r], right: sym[corner.f] });
    // C: symbool dubbel -> onmogelijk
    push({ top: sym[corner.t], left: sym[corner.f], right: sym[corner.t] });
    // extra reserve
    push({ top: sym[OPP[corner.t]], left: sym[corner.f], right: sym[corner.r] });

    const chosen = wrongs.slice(0, 3);
    const all = S.shuffle(chosen.concat([correct]));
    const options = all.map((o) => ({ svg: cubeSVG(o.top, o.left, o.right) }));
    const correctIndex = all.findIndex((o) => key(o) === key(correct));

    return {
      type: "cube",
      ruleTag: "cube",
      difficulty: difficulty || 2,
      title: "Welke kubus kun je van deze uitslag vouwen?",
      prompt: [{ svg: netSVG(sym), wide: true }],
      options,
      correctIndex,
      // zelfcontrole: precies één optie mag vouwbaar zijn
      _audit: all.map((o) => optionFoldable(o, invSym)),
      explanation:
        "Vouw de kruis-uitslag in gedachten. Tegenoverliggende vlakken (boven/onder, " +
        "links/rechts, voor/achter) kun je nooit samen zien, en de drie zichtbare vlakken " +
        "moeten in de juiste draaizin staan. Alleen het juiste antwoord voldoet.",
    };
  }

  global.Cube = { generate };
})(window);
