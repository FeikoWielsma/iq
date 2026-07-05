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
- [x] Nieuwe categorie: verplaatsing van figuren (`js/movement.js`)
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

## Fase 5 — Nieuwe categorieën (done)

### Kubus vouwen (`js/cube.js`)

- [x] Vlakmodel via normalen + handedness (echte kubus-hoeken)
- [x] Net-rendering (SVG kruis met 6 symbolen)
- [x] Isometrische kubus-rendering (3 zichtbare vlakken)
- [x] Afleiders: tegenoverliggend vlak, gespiegelde hoek, dubbel symbool
- [x] Correctheidstest: precies één vouwbare optie (20k, altijd de juiste)
- [x] Registreren in menu + mixed

### Syllogismen (`js/syllogism.js`)

- [x] Onzin-naamwoorden + vormen (geldig: Barbara/Celarent/Darii/Ferio;
      ongeldig: onverdeelde middenterm, twee particuliere/ontkennende premissen)
- [x] "Geen van deze conclusies volgt logisch."-optie
- [x] Uitleg per vorm; registreren in menu + mixed + stress-test

## Fase 7 — "Woord omgekeerd" (CCT-werkgeheugentaak) (done)

- [x] `js/cct.js`: bron-string + omgekeerde target + gaten (~40%)
- [x] Eigen scherm: bronrij, antwoordrij, A–Z-toetsenbord, item-timer
- [x] Invoer via klik én toetsenbord; Backspace wist
- [x] Score per item + opslaan in stats (`type: cct`)
- [x] Eigen menu-ingang (niet in de gewone MCQ-mix)

## Fase 6 — Polish (grotendeels done)

- [x] Rotatie: glyph-familie (3 asymmetrische figuren)
- [x] Rotatie difficulty 3: samengestelde rotatie (ring + streep)
- [x] Letterreeks-afleiders op basis van foute regels i.p.v. ±offset
- [x] Responsive CSS (menu, opties, toetsenbord) tot smalle schermen
- [x] Favicon (inline SVG) + README.md
- [ ] Visuele uitleg bij figuurvragen (veranderend attribuut uitgelicht) — open
