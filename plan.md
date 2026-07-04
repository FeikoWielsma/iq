# Plan: Capaciteitentest Trainer — remaining phases

Live site: https://feikowielsma.github.io/iq/ · Repo: https://github.com/FeikoWielsma/iq

Phases 1–2 (figure series, odd-one-out, analogies via a Raven/PGM-style
attribute×rule engine) are **done**. This document describes how to build the
remaining phases. Work through them in order; each phase is independently
shippable. Track progress in [tasks.md](tasks.md).

## Architecture ground rules

These hold for every phase below:

- **Question contract.** Every generator returns:

  ```js
  {
    type: "figures",              // category id, matches generators map
    title: "Welke figuur ...?",   // question text (Dutch)
    prompt: [ {svg} | {text} | {sep} | {mystery: true} ],  // may be []
    options: [ {svg} | {text} ],  // 5 or 6 answer options
    correctIndex: 2,
    explanation: "Regel: ...",    // Dutch, names the rule explicitly
    // Added in Phase 3:
    ruleTag: "figures:dotsDown",  // identifies the underlying rule, for analytics
    difficulty: 2                 // 1–3
  }
  ```

- **Module layout.** One IIFE module per category in `js/` exposing generators
  on a `window.<Name>` global; registered in the `generators` map near the top
  of `js/app.js`. No build step, no dependencies — push to main = deploy.

- **Distractor principle** (from DeepMind PGM / Carpenter's RPM analysis):
  every wrong option is either (a) the result of a *plausible wrong rule*
  (one step too far, wrong direction, mirrored) or (b) a single-attribute
  perturbation of the correct answer. Never random noise only. Enforce option
  uniqueness with a canonical key function per figure type
  (see `keyOf()` in `js/figures.js` and `js/rotation.js`).

- **Testing.** `node test/generators.test.js` stress-generates thousands of
  questions per category and checks: option count, no duplicate options,
  valid `correctIndex`, explanation present. Every new generator gets added
  here; run it before every commit.

---

## Phase 3 — Training loop (stats, difficulty, adaptive mode)

**Goal:** turn "spamming questions" into deliberate practice: track what goes
wrong per rule type, ramp difficulty, and steer practice toward weaknesses.

### 3a. Stats module (`js/stats.js`, new)

- localStorage key `iq-trainer-stats-v1`, JSON array of records:
  `{ type, ruleTag, correct, timeMs, ts, difficulty, exam? }`.
- API: `Stats.record(rec)`, `Stats.all()`, `Stats.byType()`, `Stats.byRule()`
  (accuracy + count per bucket), `Stats.weakest(n)` (lowest-accuracy ruleTags
  with ≥5 attempts), `Stats.clear()`.
- Hook into `answer()` and `timeUp()` in `js/app.js` (time-up counts as wrong,
  record elapsed = full timer).
- Guard all localStorage access in try/catch (private-mode Safari throws).

### 3b. ruleTag + difficulty on every generator

- Add `ruleTag` to all existing generators, e.g. `numbers:fibonacci`,
  `letters:constStep`, `figures:dotsDown+sidesUp` (joined, sorted),
  `oddone:fill`, `analogy:dotsUp`, `rotation:45cw`.
- Accept a `difficulty` argument (default 2):
  - **1**: one varying attribute / simple rules only (arithmetic, constant
    step), generous distractors (clearly-off values allowed).
  - **2**: current behaviour.
  - **3**: two simultaneous rules for figures; rarer number rules (mulAdd,
    interleaved, squares); all distractors single-step perturbations;
    timer 30s instead of 45s.

### 3c. Menu + adaptive mode

- Difficulty selector on the menu (radio: Makkelijk / Normaal / Moeilijk /
  Adaptief). Persist choice in localStorage.
- **Adaptief**: sample the next question's category and ruleTag
  inverse-proportionally to accuracy (weight = 1 − accuracy, floor 0.15 so
  strong areas still appear). Bump difficulty to 3 for rules with >80%
  accuracy, drop to 1 for rules <40%.

### 3d. Stats screen + export

- New menu section/screen: accuracy bar per category, list of 5 weakest rules
  ("Interleaved reeksen: 45% van 20 vragen"), total answered, streak record.
- Button "Oefen je zwakke plekken" → starts adaptive session.
- Export: `Blob` download of the stats JSON; Import: `<input type=file>` +
  JSON.parse with validation, merge by timestamp dedupe.

**Acceptance:** stats survive reload; weakest-rules list matches hand-checked
data; export→clear→import round-trips; adaptive mode visibly favours weak
categories (log sampling weights to console in a debug flag).

---

## Phase 4 — Exam simulation (toetsmodus)

**Goal:** practice under realistic block pressure — the actual failure mode
being trained against.

### Design (`js/exam.js`, new)

- Config screen: question count (10/20/30), total time (5/10/15 min),
  categories (default: all). Defaults: 20 questions, 10 minutes, mixed.
- During the exam: block-level countdown (mm:ss, turns red <60s), question
  N/total, **no feedback after answering** — selecting an option immediately
  advances. A "sla over" button skips (recorded as skipped, revisitable at the
  end if time remains — keep a simple queue).
- Time up or all answered → results screen:
  - Score + percentage, per-category breakdown table.
  - Review list: every wrong/skipped question re-rendered (store the full
    question objects during the exam) with the user's answer, correct answer,
    and explanation.
- Record each question into Stats with `exam: true`.
- Menu gets a prominent "Toetsmodus" button next to free practice.

**Acceptance:** timer ends the block mid-question; review shows exact
questions seen; stats records carry `exam: true`; refresh mid-exam may simply
abort the exam (no resume needed — keep it simple).

---

## Phase 5 — New categories: kubus vouwen + syllogismen

### 5a. Kubus vouwen (`js/cube.js`, new) — *hardest generator, split it up*

"Which cube can be folded from this net?" — shown as a cross-shaped net with
6 distinct symbols, options are isometric cube drawings showing 3 faces.

1. **Face model.** Fix ONE net layout (the cross:  top row = face U; middle
   row = L, F, R, B; bottom = D). Hardcode its fold result as adjacency +
   opposite pairs: U–D, L–R, F–B opposite. Do NOT write a general net folder.
2. **Symbols.** 6 clearly distinct, orientation-free symbols to start (circle,
   filled square, star, plus, ring, triangle) — orientation-free avoids the
   symbol-rotation minefield in v1. Assign symbols to faces randomly per
   question.
3. **Net rendering.** SVG: 4×3 grid of squares with symbols, cross layout.
4. **Cube rendering.** Isometric SVG showing top + front + right faces
   (three parallelograms, fixed geometry, symbol per visible face).
5. **Correct option.** Pick any corner of the cube = a valid (top, front,
   right) triple consistent with the adjacency model. Enumerate the 24
   orientations of the cube via the adjacency model to generate valid triples.
6. **Distractors.** Invalid triples: (a) two opposite faces shown together
   (impossible), (b) valid faces but arranged with wrong chirality (swap
   front/right of a valid triple — this makes it a mirror cube), (c) a face
   symbol replaced by its opposite face's symbol.
7. **Test:** in `test/generators.test.js`, verify the correct option's triple
   is in the valid-orientation set and every distractor is not.

### 5b. Syllogismen (`js/syllogism.js`, new)

- Nonsense Dutch category nouns so world knowledge can't help ("bloops",
  "razzies", "wumpers", "knars", "flieren", ~12 total, pick 3 per question).
- Premise templates as data: the 4 classic valid forms (Barbara: alle A zijn
  B + alle B zijn C ⊢ alle A zijn C; Celarent, Darii, Ferio) plus invalid
  tempters (undistributed middle: alle A zijn B + alle C zijn B ⊬ …;
  illicit conversion: alle A zijn B ⊬ alle B zijn A).
- Question: two premises as text prompt cells; options = 3–4 candidate
  conclusions + always "Geen van deze conclusies volgt logisch." For invalid
  forms, "geen van deze" is the correct answer.
- Explanation states the form name and why it does/doesn't follow.
- Text-only prompt/options — the app already supports `{text}` cells.

**Acceptance for both:** registered in menu, `mixed`, and the stress test;
cube validity test passes; syllogism correct answers verified by hand for one
example per template.

---

## Phase 6 — Polish

- **Rotation glyph family:** 4–5 asymmetric glyphs (current circle-stick,
  flag, key-like, L-with-dot) chosen randomly; difficulty 3 adds combined
  transforms (rotate + mirror alternation). Keep the `keyOf` normalization
  (angle mod 360, mirrored flag).
- **Visual explanations for figures:** after answering, render the full
  correct sequence in the feedback area with the changing attribute
  highlighted (accent-coloured dots / stroke). Extend the figure renderer
  with a `highlight` option rather than a second renderer.
- **Letter distractors** upgraded to wrong-rule-based: continue with wrong
  step size, one step short, right step from wrong letter — mirroring how
  the number distractors already work.
- **Mobile pass** at 360px width (prompt cells shrink, options 2-col), add
  favicon (inline SVG data URL is fine), README.md with a screenshot and a
  one-paragraph explanation for Sander.

---

## Phase 7 — "Woord omgekeerd" (CCT-stijl werkgeheugentaak)

**Goal:** add the letter-reversal task Sander saw in the "DemotestCCTv2"
assessment. This is a *different interaction model* from the multiple-choice
reasoning types — it gets its own screen, not a generator in the MCQ engine.

**Confirmed mechanic:** a source letter-string (a word or random string) is
shown; the answer row is that string **reversed**, with some positions blanked;
the candidate fills the blanks by clicking an on-screen A–Z keyboard (or typing),
against a per-item timer.

**Research grounding (for realistic design, not required reading):** this is a
**backward span / reverse-order recall** working-memory paradigm — the same
construct as backward digit span, applied to letters. Backward span is
considered a working-memory (not just short-term-memory) measure because it
requires an *operation* (reversal) on the held information. So difficulty scales
with string length (span), and scoring should credit partial correctness
(per-letter), which matches the literature's partial-credit recommendation.

### Design (`js/cct.js` + a new screen, new)

- Generator: pick a length (start 5, scale up), generate a source string
  (option: real Dutch words from a small bundled list, or random consonant-
  heavy strings to avoid pronounceability advantages), compute the reverse,
  blank ~30–40% of positions.
- Screen: source row (all filled), answer row (boxes, some pre-filled, some
  empty with the current cell highlighted), on-screen A–Z keyboard, item timer,
  "Verder" button.
- Input: clicking a letter fills the current empty cell and advances; Backspace
  clears. Keyboard typing also works.
- Scoring: per-letter correctness (partial credit) + time; record to Stats
  (Phase 3) with `type: "cct"`. Difficulty = string length.
- Distractor-free (it's recall, not MCQ), so it is **not** part of `mixed`'s
  MCQ pool by default — give it its own menu entry, and optionally a separate
  "werkgeheugen" toggle.

**Acceptance:** reversed target computed correctly; blanked cells fillable in
order; partial score matches hand count; timer ends the item; verified visually
in the browser.

## Verification (every phase)

1. `node test/generators.test.js` → "ALL OK".
2. Open `index.html` locally, spot-check ~10 questions in each affected
   category: rendering, correct answer actually correct, explanation matches.
3. Commit, push to main, wait for Pages build, verify the live site.
