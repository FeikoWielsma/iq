/* Rotatie-figuren: een asymmetrische figuur die per stap een vaste hoek draait.
   De opgave toont 4 standen; jij kiest de volgende. */
(function (global) {
  "use strict";

  const S = global.Sequences; // hergebruik helpers

  // Teken de (chirale) figuur in een 64x64 tegel, geroteerd over `angle` graden,
  // eventueel gespiegeld. De asymmetrische stip breekt alle symmetrie zodat
  // rotatie en spiegeling altijd te onderscheiden zijn.
  function glyphSVG(angle, mirrored) {
    const inner =
      '<circle cx="32" cy="21" r="9" fill="none" stroke="#111" stroke-width="2.5"/>' +
      '<line x1="32" y1="30" x2="32" y2="50" stroke="#111" stroke-width="2.5"/>' +
      '<line x1="23" y1="43" x2="41" y2="43" stroke="#111" stroke-width="2.5"/>' +
      '<circle cx="39" cy="14" r="3.2" fill="#111"/>';
    const rot = '<g transform="rotate(' + angle + ' 32 32)">' + inner + "</g>";
    const body = mirrored
      ? '<g transform="translate(64,0) scale(-1,1)">' + rot + "</g>"
      : rot;
    return (
      '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="2" y="2" width="60" height="60" rx="8" fill="#fff" stroke="#111" stroke-width="2"/>' +
      body +
      "</svg>"
    );
  }

  function norm(a) {
    return ((a % 360) + 360) % 360;
  }
  function keyOf(o) {
    return (o.mirrored ? "m" : "r") + norm(o.angle);
  }

  function generate() {
    const step = S.pick([45, 90, -45, -90]);
    const base = S.pick([0, 45, 90, 135, 180, 225, 270, 315]);

    // 4 zichtbare standen + het vraagteken
    const prompt = [];
    for (let i = 0; i < 4; i++) {
      prompt.push({ svg: glyphSVG(base + i * step, false) });
    }
    prompt.push({ mystery: true });

    const correct = { angle: base + 4 * step, mirrored: false };

    // Afleiders: te ver / te weinig gedraaid, 180° om, en een gespiegelde.
    const candidates = [
      { angle: correct.angle + step, mirrored: false },
      { angle: correct.angle - step, mirrored: false },
      { angle: correct.angle + 180, mirrored: false },
      { angle: correct.angle, mirrored: true },
      { angle: correct.angle - 2 * step, mirrored: false },
    ];

    const seen = new Set([keyOf(correct)]);
    const wrongs = [];
    for (const c of candidates) {
      const k = keyOf(c);
      if (!seen.has(k)) {
        seen.add(k);
        wrongs.push(c);
      }
      if (wrongs.length >= 4) break;
    }
    // veiligheidsvulling
    let extra = 15;
    while (wrongs.length < 4) {
      const c = { angle: correct.angle + extra, mirrored: false };
      const k = keyOf(c);
      if (!seen.has(k)) {
        seen.add(k);
        wrongs.push(c);
      }
      extra += 30;
    }

    const all = S.shuffle(wrongs.concat([correct]));
    const options = all.map((o) => ({ svg: glyphSVG(o.angle, o.mirrored) }));
    const correctIndex = all.indexOf(correct);

    const dir = step > 0 ? "met de klok mee" : "tegen de klok in";
    return {
      type: "rotation",
      title: "Welke figuur komt op de plaats van het vraagteken?",
      prompt,
      options,
      correctIndex,
      explanation:
        "De figuur draait elke stap " +
        Math.abs(step) +
        "° " +
        dir +
        ". Let op de stip: die geeft de stand aan.",
    };
  }

  global.Rotation = { generate };
})(window);
