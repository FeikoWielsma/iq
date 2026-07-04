/* Unit-test voor de statistiek-module. Draaien: node test/stats.test.js */
"use strict";
const path = require("path");

global.window = global;
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
};
require(path.join(__dirname, "..", "js", "stats.js"));
const S = window.Stats;

let fails = 0;
const assert = (cond, msg) => { if (!cond) { console.log("FAIL:", msg); fails++; } };

for (let i = 0; i < 6; i++) S.record({ type: "figures", ruleTag: "figures:dots", correct: i < 4, difficulty: 2 });
for (let i = 0; i < 4; i++) S.record({ type: "numbers", ruleTag: "numbers:fibonacci", correct: i < 1, difficulty: 2 });

const sum = S.summary();
assert(sum.total === 10, "total 10, got " + sum.total);
assert(sum.correct === 5, "correct 5, got " + sum.correct);

const bt = S.byType();
assert(bt.figures.n === 6 && bt.figures.correct === 4, "figures 4/6");
assert(Math.abs(bt.numbers.acc - 0.25) < 1e-9, "numbers acc 0.25");

const weak = S.weakest(5, 5);
assert(weak.length === 1 && weak[0].ruleTag === "figures:dots", "only figures:dots qualifies (>=5)");

assert(S.bestStreak() === 4, "bestStreak 4, got " + S.bestStreak());

const json = S.exportJSON();
S.clear();
assert(S.summary().total === 0, "cleared");
assert(S.importJSON(json) === 10, "imported 10");
assert(S.summary().total === 10, "after import total 10");
assert(S.importJSON(json) === 0, "re-import dedupes to 0");

let threw = false;
try { S.importJSON("{not json"); } catch (e) { threw = true; }
assert(threw, "bad json throws");

console.log(fails === 0 ? "STATS OK" : fails + " FAILURES");
process.exit(fails ? 1 : 0);
