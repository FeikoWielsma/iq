/* Syllogismen: twee premissen over onzin-categorieën (zodat wereldkennis niet
   helpt). Kies de conclusie die logisch volgt — of "geen van deze".
   Geldige vormen: Barbara, Celarent, Darii, Ferio.
   Ongeldige vallen: onverdeelde middenterm, twee particuliere/ontkennende premissen. */
(function (global) {
  "use strict";

  const S = global.Sequences;

  const NOUNS = [
    "blorki's", "vundels", "kratsen", "wemmels", "florpen", "grissen",
    "tunzen", "prakels", "snorven", "dwibben", "kwarlen", "zibben",
  ];

  const GEEN = "Geen van deze conclusies volgt logisch.";

  function say(st) {
    const [type, X, Y] = st;
    if (type === "all") return "Alle " + X + " zijn " + Y + ".";
    if (type === "no") return "Geen " + X + " zijn " + Y + ".";
    if (type === "some") return "Sommige " + X + " zijn " + Y + ".";
    return "Sommige " + X + " zijn geen " + Y + "."; // someNot
  }

  // Vormen met rollen A, B (middenterm), C. Premissen + evt. geldige conclusie
  // (over A→C) + expliciete, duidelijk-foute afleiders.
  const FORMS = [
    {
      name: "Barbara", valid: true,
      premises: [["all", "A", "B"], ["all", "B", "C"]],
      concl: ["all", "A", "C"],
      distractors: [["all", "C", "A"], ["no", "A", "C"]],
      why: "Alle A zijn B en alle B zijn C, dus alle A zijn C.",
    },
    {
      name: "Celarent", valid: true,
      premises: [["all", "A", "B"], ["no", "B", "C"]],
      concl: ["no", "A", "C"],
      distractors: [["all", "A", "C"], ["some", "A", "C"]],
      why: "Alle A zijn B en geen B zijn C, dus geen A zijn C.",
    },
    {
      name: "Darii", valid: true,
      premises: [["all", "B", "C"], ["some", "A", "B"]],
      concl: ["some", "A", "C"],
      distractors: [["all", "A", "C"], ["no", "A", "C"]],
      why: "Sommige A zijn B en alle B zijn C, dus sommige A zijn C.",
    },
    {
      name: "Ferio", valid: true,
      premises: [["no", "B", "C"], ["some", "A", "B"]],
      concl: ["someNot", "A", "C"],
      distractors: [["all", "A", "C"], ["no", "A", "C"]],
      why: "Sommige A zijn B en geen B zijn C, dus sommige A zijn geen C.",
    },
    {
      name: "onverdeelde middenterm", valid: false,
      premises: [["all", "A", "B"], ["all", "C", "B"]],
      distractors: [["all", "A", "C"], ["no", "A", "C"], ["some", "A", "C"]],
      why: "A en C delen alleen dat ze B zijn; dat verbindt A en C niet. Er volgt niets.",
    },
    {
      name: "twee particuliere premissen", valid: false,
      premises: [["some", "A", "B"], ["some", "B", "C"]],
      distractors: [["some", "A", "C"], ["all", "A", "C"], ["someNot", "A", "C"]],
      why: "Uit twee 'sommige'-uitspraken volgt geen geldige conclusie.",
    },
    {
      name: "twee ontkennende premissen", valid: false,
      premises: [["no", "A", "B"], ["no", "B", "C"]],
      distractors: [["no", "A", "C"], ["some", "A", "C"], ["all", "A", "C"]],
      why: "Uit twee ontkennende uitspraken volgt geen geldige conclusie.",
    },
  ];

  function generate(difficulty) {
    const form = S.pick(FORMS);
    const [A, B, C] = S.shuffle(NOUNS).slice(0, 3);
    const map = { A, B, C };
    const fill = (st) => [st[0], map[st[1]], map[st[2]]];

    const premises = form.premises.map((p) => say(fill(p)));

    let optionTexts, correctText;
    if (form.valid) {
      correctText = say(fill(form.concl));
      optionTexts = [correctText, say(fill(form.distractors[0])), say(fill(form.distractors[1])), GEEN];
    } else {
      correctText = GEEN;
      optionTexts = form.distractors.map((d) => say(fill(d))).concat([GEEN]);
    }
    // ontdubbel voor de zekerheid en shuffle
    optionTexts = Array.from(new Set(optionTexts));
    const all = S.shuffle(optionTexts);
    const options = all.map((t) => ({ text: t }));
    const correctIndex = all.indexOf(correctText);

    const prompt = [
      { text: premises[0], plain: true },
      { text: premises[1], plain: true },
    ];

    return {
      type: "syllogism",
      ruleTag: "syllogism:" + (form.valid ? "geldig" : "ongeldig"),
      difficulty: difficulty || 2,
      title: "Welke conclusie volgt logisch uit deze twee uitspraken?",
      optionLayout: "text",
      prompt,
      options,
      correctIndex,
      explanation: (form.valid ? "Dit is een geldige redenering (" + form.name + "). " : "Ongeldig (" + form.name + "). ") + form.why,
    };
  }

  global.Syllogism = { generate };
})(window);
