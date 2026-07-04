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

  function generateSimple() {
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

  /* ---------- Samengestelde rotatie ----------
     Twee onafhankelijke onderdelen die tegengesteld draaien:
     - een ring met een opening (binnenste deel)
     - een streep die uit de ring steekt (buitenste deel)
     Daarbij wisselt de lijndikte elke stap. */

  const CX = 32, CY = 32, RR = 12, STUB = 9;

  function ringWithGap(gapCenterDeg, gapSizeDeg, sw) {
    const pts = [];
    for (let a = gapSizeDeg / 2; a <= 360 - gapSizeDeg / 2 + 0.01; a += 6) {
      const ang = ((gapCenterDeg + a) * Math.PI) / 180;
      pts.push((CX + RR * Math.cos(ang)).toFixed(1) + "," + (CY + RR * Math.sin(ang)).toFixed(1));
    }
    return '<polyline points="' + pts.join(" ") + '" fill="none" stroke="#111" stroke-width="' +
      sw + '" stroke-linecap="round"/>';
  }

  function stub(angleDeg, sw) {
    const a = (angleDeg * Math.PI) / 180;
    const x1 = CX + RR * Math.cos(a), y1 = CY + RR * Math.sin(a);
    const x2 = CX + (RR + STUB) * Math.cos(a), y2 = CY + (RR + STUB) * Math.sin(a);
    return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) +
      '" y2="' + y2.toFixed(1) + '" stroke="#111" stroke-width="' + sw + '" stroke-linecap="round"/>';
  }

  const THIN = 2.4, THICK = 4.4;

  function compoundSVG(st) {
    const sw = st.thick ? THICK : THIN;
    return (
      '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="2" y="2" width="60" height="60" rx="8" fill="#fff" stroke="#111" stroke-width="2"/>' +
      ringWithGap(st.gap, 70, sw) +
      stub(st.stub, sw) +
      "</svg>"
    );
  }

  function cnorm(a) { return ((Math.round(a / 5) * 5 % 360) + 360) % 360; }
  function ckey(s) { return cnorm(s.gap) + ":" + cnorm(s.stub) + ":" + (s.thick ? 1 : 0); }

  function generateCompound() {
    const gapStep = S.pick([90, -90]);
    const stubStep = -gapStep; // tegengestelde richting
    const gap0 = S.pick([0, 45, 90, 135, 180, 225, 270, 315]);
    const stub0 = S.pick([0, 45, 90, 135, 180, 225, 270, 315]);
    const thick0 = Math.random() < 0.5;

    const frame = (i) => ({
      gap: gap0 + i * gapStep,
      stub: stub0 + i * stubStep,
      thick: (i % 2 === 0) === thick0,
    });

    const prompt = [];
    for (let i = 0; i < 4; i++) prompt.push({ svg: compoundSVG(frame(i)) });
    prompt.push({ mystery: true });

    const correct = frame(4);
    const f3 = frame(3);
    const candidates = [
      { gap: correct.gap - 2 * gapStep, stub: correct.stub, thick: correct.thick }, // ring verkeerde kant
      { gap: correct.gap, stub: correct.stub - 2 * stubStep, thick: correct.thick }, // streep verkeerde kant
      { gap: correct.gap, stub: correct.stub, thick: !correct.thick },               // verkeerde dikte
      { gap: f3.gap, stub: f3.stub, thick: f3.thick },                               // niet verder gedraaid
      { gap: correct.gap + gapStep, stub: correct.stub + stubStep, thick: correct.thick }, // te ver
    ];

    const seen = new Set([ckey(correct)]);
    const wrongs = [];
    for (const c of candidates) {
      const k = ckey(c);
      if (!seen.has(k)) { seen.add(k); wrongs.push(c); }
      if (wrongs.length >= 4) break;
    }
    let extra = 30;
    while (wrongs.length < 4) {
      const c = { gap: correct.gap + extra, stub: correct.stub, thick: correct.thick };
      const k = ckey(c);
      if (!seen.has(k)) { seen.add(k); wrongs.push(c); }
      extra += 45;
    }

    const all = S.shuffle(wrongs.concat([correct]));
    const options = all.map((s) => ({ svg: compoundSVG(s) }));
    const correctIndex = all.findIndex((s) => ckey(s) === ckey(correct));

    const ringDir = gapStep > 0 ? "met de klok mee" : "tegen de klok in";
    const stubDir = stubStep > 0 ? "met de klok mee" : "tegen de klok in";
    return {
      type: "rotation",
      title: "Welke figuur komt op de plaats van het vraagteken?",
      prompt,
      options,
      correctIndex,
      explanation:
        "De ring (met opening) draait 90° " + ringDir + ", terwijl de streep juist " +
        stubDir + " draait. Daarnaast wisselt de lijndikte elke stap.",
    };
  }

  function generate() {
    return Math.random() < 0.5 ? generateCompound() : generateSimple();
  }

  global.Rotation = { generate, generateSimple, generateCompound };
})(window);
