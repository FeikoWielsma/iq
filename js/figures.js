/* Figuren-engine (Raven-stijl): attributen × regels × afleiders.
   Een figuur = { sides, dots, size, fill } gerenderd als SVG.
   Drie vraagtypes:
   - generateSeries():   figurenreeks van 4 + vraagteken (zoals echte capaciteitentests)
   - generateOddOneOut(): welke figuur hoort er niet bij?
   - generateAnalogy():  A staat tot B zoals C staat tot ?
*/
(function (global) {
  "use strict";

  const S = global.Sequences; // helpers: pick, randInt, shuffle

  const SIDES_MIN = 3;
  const SIDES_MAX = 7; // t/m zevenhoek; 8+ hoeken zijn te lastig te tellen
  const DOTS_MAX = 6;
  const SIZES = [0.6, 0.7, 0.8, 0.9, 1.0];
  const SHAPE_NAMES = {
    3: "driehoek", 4: "vierkant", 5: "vijfhoek", 6: "zeshoek", 7: "zevenhoek",
  };

  /* ---------- rendering ---------- */

  // Genormaliseerde stipposities (−1..1), geschaald naar de ingeschreven cirkel
  // van de veelhoek. Max radiale afstand ~0.75 zodat stippen ruim binnen blijven.
  const DOT_LAYOUTS = [
    [],
    [[0, 0]],
    [[-0.5, 0], [0.5, 0]],
    [[-0.55, 0.5], [0, -0.55], [0.55, 0.5]],
    [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
    [[-0.5, -0.5], [0.5, -0.5], [0, 0], [-0.5, 0.5], [0.5, 0.5]],
    [[-0.5, -0.55], [0.5, -0.55], [-0.5, 0], [0.5, 0], [-0.5, 0.55], [0.5, 0.55]],
  ];

  function polygonPoints(sides, cx, cy, r) {
    const pts = [];
    // punt omhoog
    const offset = -Math.PI / 2;
    for (let i = 0; i < sides; i++) {
      const a = offset + (i * 2 * Math.PI) / sides;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + "," + (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(" ");
  }

  function figureSVG(fig) {
    const cx = 32, cy = 32;
    const r = 26 * fig.size;
    // duidelijk zichtbaar grijs vs wit; zwarte stippen/rand blijven leesbaar
    const shapeFill = fig.fill ? "#8e96a4" : "#fff";
    // Stippen binnen de ingeschreven cirkel (straal = r·cos(π/n), gecentreerd op
    // het middelpunt). Zo passen ze altijd netjes — driehoeken krijgen vanzelf
    // een kleiner veld en er is geen overlap met de randen meer.
    const inR = r * Math.cos(Math.PI / fig.sides);
    const dotR = Math.min(3.2, Math.max(1.7, inR * 0.17));
    const dots = DOT_LAYOUTS[fig.dots]
      .map(([nx, ny]) =>
        '<circle cx="' + (cx + nx * inR).toFixed(2) + '" cy="' + (cy + ny * inR).toFixed(2) +
        '" r="' + dotR.toFixed(2) + '" fill="#111"/>')
      .join("");
    return (
      '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<polygon points="' + polygonPoints(fig.sides, cx, cy, r) +
      '" fill="' + shapeFill + '" stroke="#111" stroke-width="2.5"/>' +
      dots +
      "</svg>"
    );
  }

  function keyOf(fig) {
    return [fig.sides, fig.dots, fig.size, fig.fill ? 1 : 0].join("|");
  }
  function clone(fig) {
    return { sides: fig.sides, dots: fig.dots, size: fig.size, fill: fig.fill };
  }

  function randomFigure() {
    return {
      sides: S.randInt(SIDES_MIN, SIDES_MAX),
      dots: S.randInt(0, DOTS_MAX),
      size: S.pick([0.8, 0.9, 1.0]),
      fill: Math.random() < 0.3,
    };
  }

  /* ---------- afleiders ----------
     Perturbaties van het juiste antwoord: precies één attribuut een stap fout.
     Zo lijken alle foute opties plausibel (zoals in echte tests). */
  function perturbations(fig) {
    const out = [];
    const push = (f) => {
      f.sides = Math.min(SIDES_MAX, Math.max(SIDES_MIN, f.sides));
      f.dots = Math.min(DOTS_MAX, Math.max(0, f.dots));
      out.push(f);
    };
    let f;
    f = clone(fig); f.dots += 1; push(f);
    f = clone(fig); f.dots -= 1; push(f);
    f = clone(fig); f.sides += 1; push(f);
    f = clone(fig); f.sides -= 1; push(f);
    f = clone(fig); f.fill = !f.fill; push(f);
    f = clone(fig); f.dots += 2; push(f);
    f = clone(fig); f.sides -= 2; push(f);
    f = clone(fig); f.sides += 1; f.dots -= 1; push(f);
    f = clone(fig); f.sides -= 1; f.dots += 1; push(f);
    return out;
  }

  function buildOptions(correctFig, optionCount) {
    const correctKey = keyOf(correctFig);
    const seen = new Set([correctKey]);
    const wrongs = [];
    for (const p of S.shuffle(perturbations(correctFig))) {
      const k = keyOf(p);
      if (!seen.has(k)) {
        seen.add(k);
        wrongs.push(p);
      }
      if (wrongs.length >= optionCount - 1) break;
    }
    // veiligheidsvulling met willekeurige figuren
    while (wrongs.length < optionCount - 1) {
      const f = randomFigure();
      const k = keyOf(f);
      if (!seen.has(k)) {
        seen.add(k);
        wrongs.push(f);
      }
    }
    const all = S.shuffle(wrongs.concat([correctFig]));
    return {
      options: all.map((f) => ({ svg: figureSVG(f) })),
      correctIndex: all.findIndex((f) => keyOf(f) === correctKey),
    };
  }

  /* ---------- 1. Figurenreeksen ---------- */

  // Elke "regelset" varieert 1 of 2 attributen met een progressie; de rest blijft gelijk.
  const seriesRules = [
    function dotsDown() {
      const start = S.randInt(4, DOTS_MAX);
      return {
        apply: (fig, i) => { fig.dots = start - i; },
        text: "het aantal stippen neemt elke stap met 1 af",
      };
    },
    function dotsUp() {
      const start = S.randInt(0, 2);
      return {
        apply: (fig, i) => { fig.dots = start + i; },
        text: "het aantal stippen neemt elke stap met 1 toe",
      };
    },
    function sidesUp() {
      // 3→4→5→6→7: past precies binnen SIDES_MIN..SIDES_MAX (5 waarden)
      const start = S.randInt(SIDES_MIN, SIDES_MAX - 4);
      return {
        apply: (fig, i) => { fig.sides = start + i; },
        text: "de figuur krijgt elke stap één hoek erbij",
      };
    },
    function sidesDown() {
      const start = S.randInt(SIDES_MIN + 4, SIDES_MAX);
      return {
        apply: (fig, i) => { fig.sides = start - i; },
        text: "de figuur verliest elke stap één hoek",
      };
    },
    function fillAlternate() {
      const startFilled = Math.random() < 0.5;
      return {
        apply: (fig, i) => { fig.fill = (i % 2 === 0) === startFilled; },
        text: "de vulling wisselt om en om (grijs / wit)",
      };
    },
    function sizeGrow() {
      const up = Math.random() < 0.5;
      return {
        apply: (fig, i) => { fig.size = SIZES[up ? i : 4 - i]; },
        text: up ? "de figuur wordt elke stap groter" : "de figuur wordt elke stap kleiner",
      };
    },
  ];

  // Kies conflictvrije regels: per attribuut maximaal één regel
  // (anders zou bijv. dotsUp + dotsDown elkaar overschrijven).
  const RULE_ATTR = ["dots", "dots", "sides", "sides", "fill", "size"];
  function pickRules(count) {
    const idxs = S.shuffle([0, 1, 2, 3, 4, 5]);
    const used = new Set();
    const rules = [];
    const attrs = [];
    for (const i of idxs) {
      if (used.has(RULE_ATTR[i])) continue;
      used.add(RULE_ATTR[i]);
      rules.push(seriesRules[i]());
      attrs.push(RULE_ATTR[i]);
      if (rules.length >= count) break;
    }
    return { rules, attrs };
  }

  function generateSeries(difficulty) {
    // moeilijkheid stuurt het aantal gelijktijdige regels: 1 = makkelijk,
    // 2 = standaard (zoals Sanders voorbeelden), 3 = pittig.
    const ruleCount = Math.min(3, Math.max(1, difficulty || 2));
    const { rules, attrs } = pickRules(ruleCount);

    const base = randomFigure();
    const figs = [];
    for (let i = 0; i < 5; i++) {
      const f = clone(base);
      rules.forEach((r) => r.apply(f, i));
      figs.push(f);
    }
    const prompt = figs.slice(0, 4).map((f) => ({ svg: figureSVG(f) }));
    prompt.push({ mystery: true });

    const built = buildOptions(figs[4], 5);
    return {
      type: "figures",
      ruleTag: "figures:" + attrs.slice().sort().join("+"),
      difficulty: difficulty || 2,
      title: "Welke figuur komt op de plaats van het vraagteken?",
      prompt,
      options: built.options,
      correctIndex: built.correctIndex,
      explanation: "Regel: " + rules.map((r) => r.text).join(" én ") + ".",
    };
  }

  /* ---------- 2. Uitzondering zoeken ---------- */

  function generateOddOneOut(difficulty) {
    // Discriminator: één attribuut waarin 4 figuren gelijk zijn en 1 afwijkt.
    // Eén "ruis"-attribuut krijgt 5 verschillende waarden (dan is anders-zijn
    // dáárin geen kenmerk); de overige attributen zijn overal gelijk.
    const disc = S.pick(["dots", "sides", "fill", "size"]);
    const noiseChoices = { dots: ["sides"], sides: ["dots"], fill: ["sides", "dots"], size: ["sides", "dots"] };
    const noise = S.pick(noiseChoices[disc]);

    const base = { sides: 5, dots: 3, size: 0.9, fill: false };

    // waarden voor de discriminator: gedeelde waarde + afwijkende waarde
    let shared, odd, discText;
    if (disc === "dots") {
      shared = S.randInt(1, DOTS_MAX - 1);
      odd = shared + S.pick([1, -1]);
      if (odd < 0) odd = shared + 1;
      discText = "vier figuren hebben " + shared + " stip" + (shared === 1 ? "" : "pen") +
        ", één heeft er " + odd;
    } else if (disc === "sides") {
      shared = S.randInt(SIDES_MIN, SIDES_MAX - 1);
      odd = shared + S.pick([1, -1]);
      if (odd < SIDES_MIN) odd = shared + 1;
      discText = "vier figuren zijn een " + SHAPE_NAMES[shared] + ", één is een " + SHAPE_NAMES[odd];
    } else if (disc === "fill") {
      shared = Math.random() < 0.5;
      odd = !shared;
      discText = "vier figuren zijn " + (shared ? "grijs gevuld" : "wit") +
        ", één is " + (odd ? "grijs gevuld" : "wit");
    } else {
      shared = 0.9;
      odd = 0.6;
      discText = "vier figuren zijn even groot, één is duidelijk kleiner";
    }

    // ruiswaarden: 5 verschillende
    let noisePool;
    if (noise === "sides") noisePool = S.shuffle([3, 4, 5, 6, 7]).slice(0, 5);
    else noisePool = S.shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, 5);

    const oddPos = S.randInt(0, 4);
    const figs = [];
    for (let i = 0; i < 5; i++) {
      const f = clone(base);
      f[disc] = i === oddPos ? odd : shared;
      f[noise] = noisePool[i];
      figs.push(f);
    }

    return {
      type: "oddone",
      ruleTag: "oddone:" + disc,
      difficulty: difficulty || 2,
      title: "Welke figuur hoort er niet bij?",
      prompt: [],
      options: figs.map((f) => ({ svg: figureSVG(f) })),
      correctIndex: oddPos,
      explanation:
        "Kijk niet naar de vorm" + (noise === "dots" ? " en niet naar het aantal stippen" : "") +
        ": " + discText + ".",
    };
  }

  /* ---------- 3. Analogieën (A : B = C : ?) ---------- */

  const transforms = [
    {
      id: "dots+",
      can: (f) => f.dots <= DOTS_MAX - 1,
      apply: (f) => { f.dots += 1; },
      text: "er komt één stip bij",
    },
    {
      id: "dots-",
      can: (f) => f.dots >= 1,
      apply: (f) => { f.dots -= 1; },
      text: "er gaat één stip af",
    },
    {
      id: "sides+",
      can: (f) => f.sides <= SIDES_MAX - 1,
      apply: (f) => { f.sides += 1; },
      text: "de figuur krijgt één hoek erbij",
    },
    {
      id: "sides-",
      can: (f) => f.sides >= SIDES_MIN + 1,
      apply: (f) => { f.sides -= 1; },
      text: "de figuur verliest één hoek",
    },
    {
      id: "fill",
      can: () => true,
      apply: (f) => { f.fill = !f.fill; },
      text: "de vulling wisselt (wit ↔ grijs)",
    },
    {
      id: "size",
      can: (f) => f.size >= 0.9,
      apply: (f) => { f.size = 0.6; },
      text: "de figuur wordt klein",
    },
  ];

  function generateAnalogy(difficulty) {
    const A = randomFigure();
    A.size = S.pick([0.9, 1.0]);
    const usable = transforms.filter((t) => t.can(A));
    const T = S.pick(usable);

    const B = clone(A);
    T.apply(B);

    // C: ander basisfiguur waarop dezelfde transformatie mogelijk is
    let C;
    do {
      C = randomFigure();
      C.size = S.pick([0.9, 1.0]);
    } while (!T.can(C) || keyOf(C) === keyOf(A));

    const D = clone(C);
    T.apply(D);

    const prompt = [
      { svg: figureSVG(A) },
      { sep: "→" },
      { svg: figureSVG(B) },
      { sep: "zoals" },
      { svg: figureSVG(C) },
      { sep: "→" },
      { mystery: true },
    ];

    const built = buildOptions(D, 5);
    return {
      type: "analogy",
      ruleTag: "analogy:" + T.id,
      difficulty: difficulty || 2,
      title: "A verandert in B. Welke figuur hoort dan bij C?",
      prompt,
      options: built.options,
      correctIndex: built.correctIndex,
      explanation: "De verandering van links naar rechts: " + T.text +
        ". Pas dezelfde verandering toe op de derde figuur.",
    };
  }

  global.Figures = {
    generateSeries,
    generateOddOneOut,
    generateAnalogy,
  };
})(window);
