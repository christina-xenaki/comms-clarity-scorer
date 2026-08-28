# comms-clarity-scorer

Paste a press release or pitch, get a clarity score and a list of exactly what's wrong with it.

**No data leaves your browser.** This tool has no server, no account, and no upload — everything runs as JavaScript on your own device. You can paste unreleased or confidential material and it never travels anywhere. (You can check this yourself: open your browser's network tab while using the tool — the only network request it makes is loading `config.json` from this same site.)

## Status

This follows **SPEC-v2-quality-scorer.md**, which supersedes the original spec. Sixteen checks are working, plus a three-tier rewrite system, a headline metric, structural-zone detection, and boilerplate handling:

- **Concreteness** (double-weighted) — does the text contain any numbers, dates or specifics at all
- **Strengths** (double-weighted) — the flip side of every other check: credits baseline comparisons, active voice with a named actor, precise verbs, informative quotes, and plain word choices over jargon
- **Empty quote detector** — the signature feature: flags quotes that are pure buzzword filler, and asks a guided question rather than inventing a fix
- **Buzzword density**, **hedging & weasel words**, **superlatives & absolute claims**, **nominalisation** — all measured against *content words* (function words like "the"/"of"/"and" excluded), not every word, so the percentage isn't watered down
- **Sentence length**, **readability** (Flesch-Kincaid, with its source linked), **passive voice** (only penalised past a normal, honestly-labelled threshold — some passive voice is fine)
- **Self-reference** — sorts each sentence's subject into company-facing, audience-facing, or third-party, reported as sentence counts (not a word percentage), and excludes quotes and boilerplate
- **Acronym load** — reported as "nine acronyms, four never expanded," not a percentage; only the first use of each acronym is flagged, and anything inside boilerplate, a "Notes to editors"/references block, or contact details is excluded entirely
- **Inverted pyramid** — fact depth, whether the opening sentence has a who and a when, whether a quote appears before the news, and whether information density thins out toward the end
- **Consistency & typos** — doubled words, spacing, mixed number/date formats, mixed quote styles, inconsistent capitalisation, commonly-confused words (not a spellchecker — the browser already does that)
- **English variant** — a three-way British / British Oxford / American toggle next to the text box, checking spelling, date-format ambiguity, quote punctuation, and title abbreviations against whichever you pick
- **Regulated claims** — off by default; pick a sector from the **Sector** selector at the top of the page (Healthcare, Environmental claims, AI, or Forward-looking statements) to check sector-specific terms. It's reported in its own card but is **never counted toward the overall clarity grade**, under any sector — it's a compliance flag, not a writing-quality signal.

A headline line above the grade — *"11 buzzwords. 2 concrete facts."* — is the whole thesis of the tool in one line, no percentage needed. The tool detects the document's structural zones (headline, lede, body, quotes, and boilerplate/"Notes to editors"/references/contact blocks); the trailing boilerplate zone is auto-excluded from every score and graded separately in its own small card.

Every check's explanation is split into three visually distinct parts: a **Finding** (what was detected), an **Action** (what to do about it), and a collapsed-by-default **Rationale** (the generic background, smaller and lower-contrast, with a source hyperlink where one genuinely exists).

Exactly how each check is calculated — the formula, the threshold, and where the numbers came from (including which ones are genuinely sourced, like Flesch-Kincaid, versus which are the developer's own starting heuristics) — is documented in **[SCORING.md](SCORING.md)**. That file also spells out each check's known blind spots, honestly.

Not yet built: an in-page settings panel for editing word lists without touching `config.json` directly. (The sector switcher itself is built now — see the Sector selector at the top of the page.) The visual design itself — layout, typeface, colour palette — was deliberately left alone in this round and the one before it; only the analysis logic changed.

## What each file does (plain English)

- **`index.html`** — The entire tool. This one file is the page you open in a browser: the sector selector, the text box, the English-variant selector, the "Analyze" button, the score cards, and the logic that actually reads your text and scores it. There's no separate app to install and nothing to build — you just open this file (or visit the hosted page).
- **`config.json`** — The default word lists and scoring thresholds the tool checks against, kept separate from the code so they're easy to see and edit without touching any programming: buzzwords, hedges, superlatives, company/audience/third-party term lists, irregular verbs, nominalisation mappings, word-swap rewrites, month names, an acronym allowlist, confusable-word groups, British/American spelling pairs, and every numeric threshold each check uses. `config.default.json` is an identical copy, matching the naming the sector configs use.
- **`config.greenwashing.json`**, **`config.healthcare.json`**, **`config.ai.json`**, **`config.forward-looking.json`** — Same file, same schema, each with its own sector's regulated-claim terms turned on (see SCORING.md for exactly which terms and why). Pick one from the Sector selector at the top of the page, or load one directly by adding e.g. `?config=healthcare` to the page's URL.
- **`SCORING.md`** — The plain-English methodology doc: exactly how every check's score is calculated, what every threshold means, and an honest note on where each check can get it wrong.
- **`.nojekyll`** — An empty marker file for GitHub Pages. It tells GitHub "don't run this site through Jekyll (GitHub's default site-builder)" — without it, GitHub Pages can sometimes ignore files that start with an underscore or otherwise mangle a plain static site. It has no effect on how the tool works; it only affects how GitHub hosts it.
- **`LICENSE`** — The MIT licence, a standard permissive open-source licence saying anyone can use, copy, or modify this code, with no warranty.
- **`SPEC-tool-1-quality-scorer.md`** — The original design document. Superseded by SPEC-v2, kept for history.
- **`SPEC-v2-quality-scorer.md`** — The current design document this tool is being built from.
- **`README.md`** — This file.

## How to use it

Open `index.html` in a browser (or visit the GitHub Pages link once it's live), pick a sector (or leave it on "General"), pick your English variant, paste your text into the box, and press "Analyze". Changing the sector re-runs the analysis immediately if you've already got text in the box. On a wide screen (desktop/tablet, roughly 900px and up) the page splits into two columns — your text on the left, the scores on the right, so you can scroll the text while the scores stay in view. On a phone it stacks into a single column instead. You'll get:

- A headline count above the grade, then an overall grade (A–F)
- Expandable cards with the detail behind each of the sixteen checks, each broken into a Finding, an Action, and a collapsible Rationale
- A "worst offenders" list of the specific sentences to fix first
- A "Rewrite suggestions" list — a "Suggested rewrite" where the tool is confident enough to offer one, something "Worth asking yourself" where it isn't
- Your text re-shown with every flagged category highlighted in its own colour (green for the good stuff) — tap a highlight to see why it was flagged
- A "Copy report" button to paste the summary into an email or chat

## Running it locally

The page loads its word lists over a network request (`config.json` by default, or whichever file the Sector selector picks, or `config.<sector>.json` if you add a `?config=` parameter to the URL), so it **needs to be served by a local web server** — opening the HTML file directly (`file://`) will block that request in most browsers and the tool won't be able to run. For example:

```
npx http-server .
```

then open the printed `http://localhost:...` address.

## Hosting

Intended to be hosted for free on GitHub Pages, serving directly from this repository.
