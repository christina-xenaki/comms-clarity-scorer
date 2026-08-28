# Specification — Comms Clarity Scorer

**Principle throughout:** every list, threshold, and message lives in `config/config.json`. The code contains no sector-specific content and no hardcoded word lists.

---

## A. Scoring model

### The denominator problem
Rates as a percentage of total words are misleading, because function words (the, of, and, to) are 40–50% of any text. Use instead:

- **Content words** as the denominator for buzzwords, hedges, nominalisations, superlatives. Exclude a stopword list.
- **Per sentence** counts where more intuitive: "7 of your 14 sentences contain a buzzword."
- **Per 100 words** so a 200-word pitch and a 900-word release are comparable.
- **Absolute counts** for acronyms. "Nine acronyms, four never expanded."
- **Boilerplate excluded** from the main score and graded separately. Detect the "About [Company]" block and any trailing contact details.
- **Clustering.** Report where problems concentrate: "6 of your 11 buzzwords are in paragraph 3."

### Headline metric
Display prominently, above the grade:
**"11 buzzwords. 2 concrete facts."**
This is the thesis of the tool in one line. No percentage needed.

---

## B. Reward good writing

Green highlights alongside red ones. Detect and credit:

1. **Numbers with a baseline** — "up from 12% last year" scores higher than a bare "34%"
2. **Named actor + active verb + object** — the structural opposite of passive
3. **Precise verbs** — cut, doubled, delayed, acquired, halved, closed (configurable list)
4. **Informative quotes** — contain a reason, a number, or a decision
5. **Plain word choices** where a jargon alternative existed

Sub-score: "Strengths". Contributes positively to the overall grade.

A specific timeframe ("from 3 March" rather than "in the coming months") is already credited by the concreteness check, so it isn't scored a second time here. A vague timeframe is flagged as a caution in this card but doesn't move the score.

---

## C. Concrete rewrites

Three levels of confidence. Each fix is labelled with which one applies, so the tool never pretends to more certainty than it has.

### "Suggested rewrite" — automatic rewrite, show the fixed text
- **Passive with named agent:** "was impacted by the delay" → "the delay impacted"
- **Nominalisations:** "the implementation of the policy" → "implementing the policy". Needs a noun→verb map in config (implementation→implement, provision→provide, utilisation→use, application→apply, consideration→consider)
- **Word swaps:** substitution dictionary in config. leverage→use, facilitate→help, commence→start, in order to→to, at this point in time→now, is designed to→does, utilise→use, prior to→before

### "Worth asking yourself" — guided question, no automatic fix
- **Passive with no agent:** "Mistakes were made." → "Who made them? If you'd rather not say, make that a deliberate choice rather than an accident of grammar."
- **Empty quote:** "A useful quote gives a reason, a number, or a next step. This gives none. Ask your spokesperson why you actually did this."

### "Flag only" — no rewrite offered
- Superlatives, absolute claims, regulated claims. The fix is factual or legal, not linguistic.

---

## D. Inverted pyramid checks

1. **Fact depth** — word position of the first concrete fact. Report it: "Your first specific detail appears at word 187."
2. **Lede completeness** — does sentence one carry a who and a when? ("What" isn't checked separately — reliably verifying a sentence states something meaningful needs real language understanding, which is out of scope for a regex-based tool.)
3. **Quote position** — flag a quote appearing before the news is stated
4. **Density decline** — information should thin toward the end; flag if the final paragraph is denser than the first

---

## E. Regulated claims — config-driven

Ship four configs. Off by default, enabled per config.

- `config/config.greenwashing.json` — carbon neutral, net zero, sustainable, eco-friendly, biodegradable, 100% recyclable, plastic-free, climate positive, offset
- `config/config.healthcare.json` — cure, breakthrough, safe, proven, well-tolerated, life-saving, miracle, first-in-class, revolutionary
- `config/config.ai.json` — unbiased, fair, explainable, fully autonomous, human-level, hallucination-free, guaranteed accuracy, solved
- `config/config.forward-looking.json` — will, expects to, is on track to, anticipates, projects, guidance, confident that

Plus `config/config.default.json` with regulated claims disabled.

Each config carries a `sectorName`, a `disclaimer` string, and optionally a `sourceUrl` for the relevant code or regulator.

---

## F. Consistency and error checks
Not full spellcheck. Bundling a dictionary produces noise on brand names, drug names, and surnames, and the browser already spellchecks the input box.

- Confusions: its/it's, their/there/they're, affect/effect, principle/principal, complement/compliment, discreet/discrete, practice/practise
- Doubled words, double spaces, missing space after full stop
- Unclosed quotation marks
- Company name capitalised inconsistently within the document
- Mixed number formats (1,000 vs 1000), mixed date formats
- Straight vs curly quotes and apostrophes

---

## G. English variant toggle

Three settings:
- **British (-ise)**
- **British Oxford (-ize)** — correct British English, used by OUP and the OED. A two-way toggle would wrongly flag "organize".
- **American**

Affects: spelling (-ise/-ize, -our/-or, -re/-er, -ll-/-l-), date format, punctuation inside vs outside quotation marks, "Dr" vs "Dr.".

---

## H. Accessibility — WCAG 2.2 AA, stated in README

- Semantic HTML, correct heading hierarchy
- Every highlight reachable and openable by keyboard, not hover alone
- Tap-to-toggle explanations — hover does not exist on touchscreens
- Results announced via `aria-live` when analysis completes
- Contrast at least 4.5:1 on every highlight colour
- Meaning never carried by colour alone — pair with underline styles and text labels
- **Weather emoji need `aria-label`s.** A screen reader must say "Grade B" not "sun behind cloud"
- Visible focus indicators; respect `prefers-reduced-motion`
- Real `<label>` on the textarea

---

## I. Layout

Desktop-optimised, mobile-intact. Two columns on wide screens: text on the left, scores on the right. On a phone it must not break — single column, nothing overlapping or overflowing — but the phone is not the primary target.

---

## J. Grades — weather scale

| Grade | Icon | Label |
|---|---|---|
| A | ☀️ | Clear |
| B | 🌤 | Mostly clear |
| C | ⛅ | Hazy |
| D | 🌫 | Foggy |
| E | 🌧 | Murky |

Deliberately not faces. People run this over a colleague's or CEO's copy; being told a quote is 💀 is awkward in an open-plan office.

---

## K. Sourcing — shown in the UI

Every threshold shows where it came from, via the hover/tap explainer.

**Genuinely sourceable:**
- Flesch-Kincaid grade level — Flesch (1948); Kincaid et al. (1975), developed for the US Navy
- plainlanguage.gov and the US Plain Writing Act 2010
- UK Government Digital Service style guide
- Reuters Handbook of Journalism (free online)
- Helen Sword on nominalisations ("zombie nouns")
- Orwell, *Politics and the English Language* (1946)
- Inverted pyramid — standard news writing convention

**Not sourceable, and must say so:**
- The 20% passive voice threshold is a widely repeated convention, not a research finding. Label it as such. Claiming otherwise would be exactly the false precision this tool exists to criticise.

---

## L. Disclaimer

Cover: directional not authoritative; regulated-claim flags are a prompt to consult your own legal, compliance, or medical affairs team, not sign-off; does not replace an editor; tuned for English; **a good score does not mean the release is accurate, newsworthy, or that it will earn coverage.**

---

## M. Privacy note — exact wording

Use this on the page and in the README, verbatim:

> The analysis runs in your browser, on your device. Your text is never uploaded anywhere, so you can safely paste a draft that hasn't been published yet.

---

## N. Export — treat as a distribution channel

- Two formats: rich text for email, plain text for Slack
- Structure: grade and weather icon → the "11 buzzwords, 2 facts" headline → top five fixes with their concrete rewrites
- Tool name and URL in the footer. The recipient is a target user.
- Print stylesheet — gives PDF export free, since browsers print to PDF
- *Future idea: shareable PNG scorecard for LinkedIn*

---

## O. Visual design

Real typeface from Google Fonts, restrained palette, generous max-width, soft cards for sub-scores. Colour-blind safe: roughly 8% of men have some colour vision deficiency and this interface is colour-coded throughout.

---

## PARKED — do not build yet

**Passive voice benchmark study.** Run the scorer over a sample of real press releases and report the actual distribution, so thresholds become "worse than 70% of published releases" rather than an invented convention. Original, defensible, nobody else has it.

*Known problem to solve first: there is no free dataset ranking releases by earned coverage — that data is proprietary to Cision and similar. Sampling frame and proxy metric need designing before any collection starts. Discuss before building.*
