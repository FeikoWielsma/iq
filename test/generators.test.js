/* Stress-test voor alle vraaggeneratoren.
   Draaien:  node test/generators.test.js  (vanuit de repo-root of waar dan ook) */
"use strict";
const path = require("path");

global.window = global;
require(path.join(__dirname, "..", "js", "sequences.js"));
require(path.join(__dirname, "..", "js", "rotation.js"));
require(path.join(__dirname, "..", "js", "figures.js"));
require(path.join(__dirname, "..", "js", "arrows.js"));
require(path.join(__dirname, "..", "js", "staticseries.js"));
require(path.join(__dirname, "..", "js", "counting.js"));
require(path.join(__dirname, "..", "js", "movement.js"));
require(path.join(__dirname, "..", "js", "cube.js"));
require(path.join(__dirname, "..", "js", "syllogism.js"));

const gens = {
  numbers: window.Sequences.generateNumber,
  letters: window.Sequences.generateLetter,
  rotationSimple: window.Rotation.generateSimple,
  rotationCompound: window.Rotation.generateCompound,
  figures: window.Figures.generateSeries,
  oddone: window.Figures.generateOddOneOut,
  analogy: window.Figures.generateAnalogy,
  arrows: window.Arrows.generate,
  staticseries: window.StaticSeries.generate,
  counting: window.Counting.generate,
  movement: window.Movement.generate,
  cube: window.Cube.generate,
  syllogism: window.Syllogism.generate,
};
const expectedOptions = {
  numbers: 6, letters: 6, rotationSimple: 5, rotationCompound: 5,
  figures: 5, oddone: 5, analogy: 5, arrows: 5, staticseries: 4, counting: 5,
  movement: 4, cube: 4, syllogism: 4,
};

const ITERATIONS = 3000;
let fails = 0;
let total = 0;

const DIFFS = [undefined, 1, 2, 3];

for (let i = 0; i < ITERATIONS; i++) {
  for (const [name, gen] of Object.entries(gens)) {
    const diff = DIFFS[i % DIFFS.length];
    const q = gen(diff);
    total++;
    if (q.options.length !== expectedOptions[name]) {
      console.log("bad option count", name, q.options.length);
      fails++;
    }
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      console.log("bad correctIndex", name, q.correctIndex);
      fails++;
    }
    const keys = q.options.map((o) => o.text || o.svg);
    if (new Set(keys).size !== keys.length) {
      fails++;
      if (fails < 4) console.log("duplicate options in", name);
    }
    if (!q.explanation) {
      console.log("missing explanation", name);
      fails++;
    }
    if (!q.title) {
      console.log("missing title", name);
      fails++;
    }
    // ruleTag ontbreekt alleen bij de losse rotatie-varianten (die krijgt de
    // publieke generate() mee); voor de rest verwachten we hem wel.
    if (!q.ruleTag) {
      console.log("missing ruleTag", name);
      fails++;
    }
    // figurenreeks: de zichtbare figuren mogen niet allemaal identiek zijn
    if (name === "figures") {
      const pk = q.prompt.filter((c) => c.svg).map((c) => c.svg);
      if (new Set(pk).size === 1) {
        console.log("static series (no visible rule)", name);
        fails++;
      }
    }
  }
}

console.log(fails === 0 ? "ALL OK (" + total + " questions)" : fails + " FAILURES");
process.exit(fails === 0 ? 0 : 1);
