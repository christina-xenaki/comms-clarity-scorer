# comms-clarity-scorer

Paste a press release or pitch, get a clarity score and a list of exactly what's wrong with it.

**No data leaves your browser.** This tool has no server, no account, and no upload — everything runs as JavaScript on your own device. You can paste unreleased or confidential material and it never travels anywhere. (You can check this yourself: open your browser's network tab while using the tool — the only network request it makes is loading `config.json` from this same site.)

## Status

Eleven of the checks described in the spec (plus a couple added along the way) are working:

- **Concreteness** — does the text contain any numbers, dates or specifics at all
- **Empty quote detector** — the signature feature: flags quotes that are pure buzzword filler
- **Buzzword density** — how much corporate jargon ("synergy", "best-in-class", "cutting-edge"...) is in the text
- **Sentence length** — flags sentences that run too long to skim
- **Readability** — a Flesch-Kincaid grade-level score with a plain-English explanation
- **Passive voice** — flagged, but only penalised past a normal threshold — some passive voice is fine
- **Hedging & weasel words** — "may", "could", "aims to", "up to"...
- **Superlatives & absolute claims** — "best", "only", "guaranteed", "always"...
- **Nominalisation** — verbs turned into nouns, e.g. "the implementation of" instead of "implementing"
- **Self-reference ratio** — how much the text talks about the company vs. the reader
- **Acronym load** — jargon-density from unexplained acronyms

Exactly how each one is calculated — the formula, the threshold, and where the numbers came from — is documented in **[SCORING.md](SCORING.md)**. That file also spells out each check's known blind spots, honestly.

Not yet built: sector-specific regulated-claim flags (the config-driven, off-by-default check for pharma/AI/financial-services terms) and the in-browser settings panel for editing word lists without touching `config.json` directly.

## What each file does (plain English)

- **`index.html`** — The entire tool. This one file is the page you open in a browser: the text box, the "Analyze" button, the score cards, and the logic that actually reads your text and scores it. There's no separate app to install and nothing to build — you just open this file (or visit the hosted page).
- **`config.json`** — All the word lists and scoring thresholds the tool checks against, kept separate from the code so they're easy to see and edit without touching any programming: buzzwords, hedge words, superlatives, self-reference terms, irregular verbs (for passive-voice detection), month names, an acronym allowlist, and the numeric thresholds each check uses. If `index.html` can't find or load this file for some reason, it falls back to a built-in copy of the same lists so the tool still works.
- **`SCORING.md`** — The plain-English methodology doc: exactly how every check's score is calculated, what every threshold means, and an honest note on where each check can get it wrong.
- **`.nojekyll`** — An empty marker file for GitHub Pages. It tells GitHub "don't run this site through Jekyll (GitHub's default site-builder)" — without it, GitHub Pages can sometimes ignore files that start with an underscore or otherwise mangle a plain static site. It has no effect on how the tool works; it only affects how GitHub hosts it.
- **`LICENSE`** — The MIT licence, a standard permissive open-source licence saying anyone can use, copy, or modify this code, with no warranty.
- **`SPEC-tool-1-quality-scorer.md`** — The original design document this tool is being built from: who it's for, what all the checks should eventually do, and what "done" looks like.
- **`README.md`** — This file.

## How to use it

Open `index.html` in a browser (or visit the GitHub Pages link once it's live), paste your text into the box, and press "Analyze". On a wide screen (desktop/tablet, roughly 900px and up) the page splits into two columns — your text on the left, the scores on the right, so you can scroll the text while the scores stay in view. On a phone it stacks into a single column instead. You'll get:

- An overall grade (A–F) at the top of the scores column
- Expandable cards with the detail behind each of the eleven checks
- A "worst offenders" list of the specific sentences to fix first
- Your text re-shown with every flagged category highlighted in its own colour — tap a highlight to see why it was flagged
- A "Copy report" button to paste the summary into an email or chat

## Running it locally

Because the page loads `config.json` via a network request, some browsers block that request if you just double-click the HTML file (`file://` URLs are restricted this way). If the word-list doesn't load, the tool still works using a built-in fallback list — but to get the real `config.json`, serve the folder with any static file server, for example:

```
npx http-server .
```

then open the printed `http://localhost:...` address.

## Hosting

Intended to be hosted for free on GitHub Pages, serving directly from this repository.
