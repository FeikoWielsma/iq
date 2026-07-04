/* Voortgang & statistieken in localStorage.
   Eén record per beantwoorde vraag:
   { type, ruleTag, correct, timeMs, difficulty, exam, ts } */
(function (global) {
  "use strict";

  const KEY = "iq-trainer-stats-v1";
  const MAX = 5000; // begrens de opslag

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* localStorage geblokkeerd of corrupt */ }
    return [];
  }
  function save(arr) {
    try {
      localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX)));
    } catch (e) { /* negeren */ }
  }

  let records = load();
  let seq = 0;

  function record(rec) {
    const ts = Date.now();
    records.push({
      id: ts + "-" + (seq++) + "-" + Math.random().toString(36).slice(2, 7),
      type: rec.type,
      ruleTag: rec.ruleTag || rec.type,
      correct: !!rec.correct,
      timeMs: rec.timeMs || 0,
      difficulty: rec.difficulty || 2,
      exam: !!rec.exam,
      ts: ts,
    });
    if (records.length > MAX) records = records.slice(-MAX);
    save(records);
  }

  function all() { return records.slice(); }

  function summary() {
    const total = records.length;
    const correct = records.reduce((n, r) => n + (r.correct ? 1 : 0), 0);
    return { total, correct, acc: total ? correct / total : 0 };
  }

  // { type: { n, correct, acc } }
  function byType() {
    const m = {};
    for (const r of records) {
      const b = (m[r.type] = m[r.type] || { n: 0, correct: 0, acc: 0 });
      b.n++;
      if (r.correct) b.correct++;
    }
    for (const k in m) m[k].acc = m[k].n ? m[k].correct / m[k].n : 0;
    return m;
  }

  // gesorteerde lijst zwakste regels met minstens `minN` pogingen
  function weakest(minN, count) {
    minN = minN || 5;
    count = count || 5;
    const m = {};
    for (const r of records) {
      const b = (m[r.ruleTag] = m[r.ruleTag] || { ruleTag: r.ruleTag, type: r.type, n: 0, correct: 0 });
      b.n++;
      if (r.correct) b.correct++;
    }
    return Object.values(m)
      .filter((b) => b.n >= minN)
      .map((b) => ({ ...b, acc: b.correct / b.n }))
      .sort((a, b) => a.acc - b.acc || b.n - a.n)
      .slice(0, count);
  }

  function bestStreak() {
    // langste reeks goede antwoorden in de historie (in volgorde)
    let best = 0, cur = 0;
    for (const r of records) {
      if (r.correct) { cur++; best = Math.max(best, cur); }
      else cur = 0;
    }
    return best;
  }

  function clear() {
    records = [];
    save(records);
  }

  function exportJSON() {
    return JSON.stringify(records, null, 2);
  }

  // voegt geïmporteerde records samen, ontdubbelt op id (val terug op ts);
  // retourneert aantal toegevoegd
  function importJSON(str) {
    let incoming;
    try { incoming = JSON.parse(str); } catch (e) { throw new Error("Ongeldig JSON-bestand."); }
    if (!Array.isArray(incoming)) throw new Error("Verwacht een lijst met records.");
    const key = (r) => r.id || "ts:" + r.ts;
    const have = new Set(records.map(key));
    let added = 0;
    for (const r of incoming) {
      if (r && typeof r === "object") {
        const k = key(r);
        if (!have.has(k)) { records.push(r); have.add(k); added++; }
      }
    }
    records.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    save(records);
    return added;
  }

  global.Stats = {
    record, all, summary, byType, weakest, bestStreak, clear, exportJSON, importJSON,
  };
})(window);
