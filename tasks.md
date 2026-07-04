# Tasks

Zie [plan.md](plan.md) voor de details per fase. Eén taak ≈ één commit.

## Fase 1 — Figurenreeksen (done)

- [x] Attribute×rule figuur-engine (`js/figures.js`)
- [x] Figurenreeks-generator met 1–2 gelijktijdige regels
- [x] Afleiders via single-attribute perturbaties
- [x] Stress-test voor alle generatoren

## Fase 2 — Uitzondering + analogieën (done)

- [x] Uitzondering zoeken (odd-one-out) met ruis-attribuut
- [x] Figuur-analogieën (A:B :: C:?)
- [x] Categorieën in menu + mixed

## Live feedback (done)

- [x] Grijze vulling duidelijk zichtbaar (#8e96a4 i.p.v. bijna-wit)
- [x] Figurenreeks standaard 2 gelijktijdige regels (soms 3)
- [x] Stippen binnen ingeschreven cirkel → geen overlap in driehoeken
- [x] Nieuwe categorie: pijlen & stippen (`js/arrows.js`)
- [x] Samengestelde rotatie: ring + streep draaien tegengesteld, dikte wisselt
- [x] Gemengd als standaard + per-categorie toggles (persist in localStorage)
- [x] Cache-busting `?v=` op assets (voorkomt stale app.js)
- [x] Antwoordfiguren groter; vormen t/m zevenhoek (8+ te lastig)
- [x] Rotatie pittiger: 45°/90° en ring & streep verschillend groot
- [x] Nieuwe categorie: statische reeks (`js/staticseries.js`)
- [x] Nieuwe categorie: aantallen tellen met afleiding (`js/counting.js`)
- [x] `ruleTag` + `difficulty` op alle generatoren (voorbereiding fase 3)

## Fase 3 — Trainingslus (done)

- [x] `js/stats.js`: record/aggregate in localStorage (`iq-trainer-stats-v1`)
- [x] `ruleTag` toevoegen aan alle bestaande generatoren
- [x] `difficulty`-parameter (1–3) in alle generatoren
- [x] Moeilijkheidskeuze in het menu (persist in localStorage)
- [x] Adaptieve modus: inverse-accuracy sampling van categorie + difficulty
- [x] Statistiekenscherm: accuracy per categorie, 5 zwakste regels
- [x] "Oefen je zwakke plekken"-knop
- [x] Export/import van stats als JSON-bestand
- [x] `test/stats.test.js` + stress-test met ruleTag/difficulty

## Fase 4 — Toetsmodus (done)

- [x] Configuratie in menu (aantal vragen, tijd)
- [x] Examenflow: blok-timer, geen feedback, overslaan/beëindigen
- [x] Resultaatscherm: score + uitsplitsing per categorie
- [x] Review van fouten/overgeslagen vragen met uitleg
- [x] Exam-records (`exam: true`) in stats
- [x] "Toetsmodus" in het menu

## Fase 5 — Nieuwe categorieën

### Kubus vouwen (`js/cube.js`)

- [ ] Face-model: vaste kruis-uitslag + adjacency/opposites hardcoded
- [ ] 24 geldige kubus-oriëntaties enumereren uit het model
- [ ] Net-rendering (SVG kruis met 6 symbolen)
- [ ] Isometrische kubus-rendering (3 zichtbare vlakken)
- [ ] Afleiders: opposite-faces-samen, verkeerde chiraliteit, verwisseld symbool
- [ ] Validiteitstest in `test/generators.test.js`
- [ ] Registreren in menu + mixed

### Syllogismen (`js/syllogism.js`)

- [ ] Nonsens-zelfstandige naamwoorden + premisse-templates (geldig: Barbara,
      Celarent, Darii, Ferio; ongeldig: undistributed middle, illicit conversion)
- [ ] Vraaggeneratie met "Geen van deze conclusies volgt logisch."-optie
- [ ] Uitleg per vorm (waarom het wel/niet volgt)
- [ ] Registreren in menu + mixed + stress-test

## Fase 7 — "Woord omgekeerd" (CCT-werkgeheugentaak)

Aparte schermsoort (geen MCQ). Mechaniek bevestigd: doelwoord omgekeerd, met
gaten die je invult via een A–Z-toetsenbord. Constructie = backward span.

- [ ] `js/cct.js`: bron-string + omgekeerde target + gaten (30–40%)
- [ ] Nieuw scherm: bronrij, antwoordrij met vakjes, A–Z-toetsenbord, item-timer
- [ ] Invoer via klik én toetsenbord; Backspace wist
- [ ] Score per letter (partial credit) + tijd, opslaan in stats (`type: cct`)
- [ ] Eigen menu-ingang (niet in de gewone MCQ-mix)

## Fase 6 — Polish

- [ ] Rotatie: glyph-familie (4–5 asymmetrische figuren)
- [ ] Rotatie difficulty 3: roteren + spiegelen gecombineerd
- [ ] Visuele uitleg bij figuurvragen (veranderend attribuut uitgelicht)
- [ ] Letterreeks-afleiders op basis van foute regels i.p.v. ±offset
- [ ] Mobile pass op 360px breedte
- [ ] Favicon + README.md met screenshot
