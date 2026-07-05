# Capaciteitentest Trainer

Oefen onbeperkt op capaciteiten-, cognitieve en intelligentietesten zoals je die
bij sollicitaties (assessments) tegenkomt. Alle vragen worden **automatisch en
oneindig gegenereerd** — je kunt dus eindeloos blijven oefenen zonder dat je
antwoorden uit je hoofd leert.

**Live:** https://feikowielsma.github.io/iq/

## Wat kun je oefenen?

Meerkeuzecategorieën (met uitleg van de regel na elk antwoord):

- **Figurenreeksen** — welke figuur volgt?
- **Statische reeks** — geen verandering, maar een telrelatie die in elke figuur klopt
- **Pijlen & stippen** — richting/vulling/aantal volgen een patroon
- **Aantallen tellen** — tel de streepjes; de draaiing van de lijn is afleiding
- **Verplaatsing van figuren** — elk figuur volgt zijn eigen route
- **Figuren roteren** — losse en samengestelde rotaties (ring + streep)
- **Uitzondering zoeken** — welke hoort er niet bij?
- **Analogieën** — A staat tot B zoals C tot ?
- **Kubus vouwen** — welke kubus past bij de uitslag?
- **Syllogismen** — welke conclusie volgt logisch?
- **Getallen- en letterreeksen**

Plus een aparte **werkgeheugentaak** ("woord omgekeerd", CCT-stijl): typ het
omgekeerde woord.

## Modi

- **Gemengd oefenen** met per-categorie aan/uit en niveau (makkelijk → moeilijk),
  of **adaptief**: dan komen je zwakke onderdelen vaker langs.
- **Toetsmodus** — een blok vragen op tijd, zonder tussentijdse feedback, met
  een resultaatoverzicht en nabespreking van je fouten.
- **Statistieken** — je voortgang per categorie en je zwakste onderdelen,
  met export/import (blijft lokaal in je browser bewaard).

## Techniek

Puur HTML/CSS/JavaScript, geen build-stap, geen server. Elke vraag komt uit een
generator in `js/`, die attributen × regels combineert (aanpak à la DeepMind's
PGM / Carpenter's analyse van Raven's matrices); foute antwoorden zijn steeds
plausibele "verkeerde regels".

Draaien: open `index.html` of host de map (bijv. GitHub Pages).

Tests: `node test/generators.test.js` en `node test/stats.test.js`.

Zie `plan.md` en `tasks.md` voor de ontwikkelroadmap.
