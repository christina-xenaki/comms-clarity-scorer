# comms-clarity-scorer

Paste a press release or pitch, get a clarity score and a list of exactly what's wrong with it.

**No data leaves your browser.** This tool has no server, no account, and no upload — everything runs as JavaScript on your own device. You can paste unreleased or confidential material and it never travels anywhere. (You can check this yourself: open your browser's network tab while using the tool — the only network request it makes is loading `config.json` from this same site.)

## Status

This follows **SPEC-v2-quality-scorer.md**, which supersedes the original spec. Sixteen checks are working, plus a three-tier rewrite system, a headline metric, and boilerplate handling:

- **Concreteness** (double-weighted) — does the text contain any numbers, dates or specifics at all
- **Strengths** (double-weighted) — the flip side of every other check: credits baseline comparisons, active voice with a named actor, precise verbs, informative quotes, and plain word choices over jargon
- **Empty quote detector** — the signature feature: flags quotes that are pure buzzword filler, and asks a guided question rather than inventing a fix
- **Buzzword density**, **hedging & weasel words**, **superlatives & absolute claims**, **nominalisation** — all measured against *content words* (function words like "the"/"of"/"and" excluded), not every word, so the percentage isn't watered down
- **Sentence length**, **readability** (Flesch-Kincaid, with its source cited), **passive voice** (only penalised past a normal, honestly-labelled threshold — some passive voice is fine)
- **Self-reference ratio** — how much the text talks about the company vs. the reader
- **Acronym load** — now reported as "nine acronyms, four never expanded," not a percentage
- **Inverted pyramid** — fact depth, whether the opening sentence has a who and a when, whether a quote appears before the news, and whether information density thins out toward the end
- **Consistency & typos** — doubled words, spacing, mixed number/date formats, mixed quote styles, inconsistent capitalisation, commonly-confused words (not a spellchecker — the browser already does that)
- **English variant** — a three-way British / British Oxford / American toggle next to the text box, checking spelling, date-format ambiguity, quote punctuation, and title abbreviations against whichever you pick
- **Regulated claims** — off by default; load a sector config via a URL parameter (see below) to check greenwashing, healthcare, responsible-AI, or forward-looking-statement terms

A headline line above the grade — *"11 buzzwords. 2 concrete facts."* — is the whole thesis of the tool in one line, no percentage needed. A trailing "About [Company]"/media-contact block is auto-detected and excluded from every score, then graded separately in its own small card.

Exactly how each check is calculated — the formula, the threshold, and where the numbers came from (including which ones are genuinely sourced, like Flesch-Kincaid, versus which are the developer's own starting heuristics) — is documented in **[SCORING.md](SCORING.md)**. That file also spells out each check's known blind spots, honestly.

Not yet built: an in-page settings panel for editing word lists without touching `config.json` directly, and an in-page switcher for the sector regulated-claims configs (currently loaded via a `?config=` URL parameter). The visual design itself — layout, typeface, colour palette — was deliberately left alone in this round; only the analysis logic changed.

## What each file does (plain English)

- **`index.html`** — The entire tool. This one file is the page you open in a browser: the text box, the variant selector, the "Analyze" button, the score cards, and the logic that actually reads your text and scores it. There's no separate app to install and nothing to build — you just open this file (or visit the hosted page).
- **`config.json`** — The default word lists and scoring thresholds the tool checks against, kept separate from the code so they're easy to see and edit without touching any programming: buzzwords, hedges, superlatives, self-reference terms, irregular verbs, nominalisation mappings, word-swap rewrites, month names, an acronym allowlist, confusable-word groups, British/American spelling pairs, and every numeric threshold each check uses. `config.default.json` is an identical copy, matching the naming the sector configs use.
- **`config.greenwashing.json`**, **`config.healthcare.json`**, **`config.ai.json`**, **`config.forward-looking.json`** — Same file, same schema, each with its own sector's regulated-claim terms turned on (see SCORING.md for exactly which terms and why). Load one by adding e.g. `?config=healthcare` to the page's URL.
- **`SCORING.md`** — The plain-English methodology doc: exactly how every check's score is calculated, what every threshold means, and an honest note on where each check can get it wrong.
- **`.nojekyll`** — An empty marker file for GitHub Pages. It tells GitHub "don't run this site through Jekyll (GitHub's default site-builder)" — without it, GitHub Pages can sometimes ignore files that start with an underscore or otherwise mangle a plain static site. It has no effect on how the tool works; it only affects how GitHub hosts it.
- **`LICENSE`** — The MIT licence, a standard permissive open-source licence saying anyone can use, copy, or modify this code, with no warranty.
- **`SPEC-tool-1-quality-scorer.md`** — The original design document. Superseded by SPEC-v2, kept for history.
- **`SPEC-v2-quality-scorer.md`** — The current design document this tool is being built from.
- **`README.md`** — This file.

## How to use it

Open `index.html` in a browser (or visit the GitHub Pages link once it's live), pick your English variant, paste your text into the box, and press "Analyze". On a wide screen (desktop/tablet, roughly 900px and up) the page splits into two columns — your text on the left, the scores on the right, so you can scroll the text while the scores stay in view. On a phone it stacks into a single column instead. You'll get:

- A headline count above the grade, then an overall grade (A–F)
- Expandable cards with the detail behind each of the sixteen checks
- A "worst offenders" list of the specific sentences to fix first
- A "Rewrite suggestions" list — automatic fixes where the tool is confident enough to offer one, guided questions where it isn't
- Your text re-shown with every flagged category highlighted in its own colour (green for the good stuff) — tap a highlight to see why it was flagged
- A "Copy report" button to paste the summary into an email or chat

## Running it locally

The page loads its word lists over a network request (`config.json` by default, or `config.<sector>.json` if you add a `?config=` parameter to the URL), so it **needs to be served by a local web server** — opening the HTML file directly (`file://`) will block that request in most browsers and the tool won't be able to run. For example:

```
npx http-server .
```

then open the printed `http://localhost:...` address.

## Hosting

Intended to be hosted for free on GitHub Pages, serving directly from this repository.
