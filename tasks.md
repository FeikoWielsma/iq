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

## Fase 3 — Trainingslus

- [ ] `js/stats.js`: record/aggregate in localStorage (`iq-trainer-stats-v1`)
- [ ] `ruleTag` toevoegen aan alle bestaande generatoren
- [ ] `difficulty`-parameter (1–3) in alle generatoren
- [ ] Moeilijkheidskeuze in het menu (persist in localStorage)
- [ ] Adaptieve modus: inverse-accuracy sampling van categorie + ruleTag
- [ ] Statistiekenscherm: accuracy per categorie, 5 zwakste regels
- [ ] "Oefen je zwakke plekken"-knop
- [ ] Export/import van stats als JSON-bestand
- [ ] Stress-test uitbreiden: ruleTag + difficulty aanwezig op elke vraag

## Fase 4 — Toetsmodus

- [ ] `js/exam.js`: configscherm (aantal vragen, tijd, categorieën)
- [ ] Examenflow: blok-timer, geen feedback, overslaan-knop
- [ ] Resultaatscherm: score + uitsplitsing per categorie
- [ ] Review van fouten/overgeslagen vragen met uitleg
- [ ] Exam-records (`exam: true`) in stats
- [ ] "Toetsmodus"-knop in het menu

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

## Fase 6 — Polish

- [ ] Rotatie: glyph-familie (4–5 asymmetrische figuren)
- [ ] Rotatie difficulty 3: roteren + spiegelen gecombineerd
- [ ] Visuele uitleg bij figuurvragen (veranderend attribuut uitgelicht)
- [ ] Letterreeks-afleiders op basis van foute regels i.p.v. ±offset
- [ ] Mobile pass op 360px breedte
- [ ] Favicon + README.md met screenshot
