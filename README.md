# comms-clarity-scorer

Paste a press release or pitch, get a clarity score and a list of exactly what's wrong with it.

**No data leaves your browser.** The analysis runs in your browser, on your device. Your text is never uploaded anywhere, so you can safely paste a draft that hasn't been published yet. This tool has no server and no account. (You can check this yourself: open your browser's network tab while using the tool — the only network requests it makes are loading `config/config.json` from this same site and the Google Font used for the interface.)

## Status

This follows **[SPEC.md](SPEC.md)**. Sixteen checks are working, plus a three-tier rewrite system, a headline metric, structural-zone detection, and boilerplate handling:

- **Concreteness** (double-weighted) — does the text contain any numbers, dates or specifics at all
- **Strengths** (double-weighted) — the flip side of every other check: credits baseline comparisons, active voice with a named actor, precise verbs, informative quotes, and plain word choices over jargon
- **Empty quote detector** — the signature feature: flags quotes that are pure buzzword filler, and asks a guided question rather than inventing a fix
- **Buzzword density**, **hedging & weasel words**, **superlatives & absolute claims**, **nominalisation** — all measured against *content words* (function words like "the"/"of"/"and" excluded), not every word, so the percentage isn't watered down
- **Sentence length**, **readability** (Flesch-Kincaid), **passive voice** (only penalised past a normal, honestly-labelled threshold — some passive voice is fine)
- **Self-reference** — sorts each sentence's subject into company-facing, audience-facing, or third-party, reported as sentence counts (not a word percentage), and excludes quotes and boilerplate
- **Acronym load** — reported as "nine acronyms, four never expanded," not a percentage; only the first use of each acronym is flagged, and anything inside boilerplate, a "Notes to editors"/references block, or contact details is excluded entirely
- **Inverted pyramid** — fact depth, whether the opening sentence has a who and a when, whether a quote appears before the news, and whether information density thins out toward the end
- **Consistency & typos** — doubled words, spacing, mixed number/date formats, mixed quote styles, inconsistent capitalisation, commonly-confused words (not a spellchecker — the browser already does that)
- **English variant** — a three-way British / British Oxford / American toggle next to the text box, checking spelling, date-format ambiguity, quote punctuation, and title abbreviations against whichever you pick
- **Regulated claims** — off by default; pick a sector from the **Sector** selector at the top of the page (Healthcare, Environmental claims, AI, or Forward-looking statements) to check sector-specific terms. It's reported in its own card but is **never counted toward the overall clarity grade**, under any sector — it's a compliance flag, not a writing-quality signal.

A headline line above the grade — *"11 buzzwords. 2 concrete facts."* — is the whole thesis of the tool in one line, no percentage needed. The tool detects the document's structural zones (headline, lede, body, quotes, and boilerplate/"Notes to editors"/references/contact blocks); the trailing boilerplate zone is auto-excluded from every score and graded separately in its own small card.

Every check's explanation is split into three visually distinct parts: a **Finding** (what was detected), an **Action** (what to do about it), and a **Rationale** — the generic background, collapsed by default behind a "Why this check exists" pill button, smaller and lower-contrast once opened. For nine checks (concreteness, passive voice, sentence length, readability, hedging, nominalisation, superlatives, inverted pyramid, regulated claims), that text is quoted verbatim from **[COPY.md](COPY.md)**, the repo's canonical interface-copy source.

Exactly how each check is calculated — the formula, the threshold, and where the numbers came from (including which ones are genuinely sourced, like Flesch-Kincaid, versus which are the developer's own starting heuristics) — is documented in **[SCORING.md](SCORING.md)**. That file also spells out each check's known blind spots, honestly.

Not yet built:
- An in-page settings panel for editing word lists without touching `config/config.json` directly. (The sector switcher itself is built now — see the Sector selector at the top of the page.)
- Two strings specified in **[COPY.md](COPY.md)** still aren't wired into the interface: the exact empty-state copy (the textarea's placeholder text is used instead), and the full disclaimer behind a "What this tool can and can't tell you" link with its short teaser under the grade (the footer shows its own short, paraphrased disclaimer inline instead). COPY.md itself flags both as not yet implemented. The "Share score" button, its shared-text template, and the exact "Export footer" wording are now built — see "Export, share, and print" below.

### Export, share, and print

- **Two export buttons** — "Copy for email" copies a rich-text summary (grade and weather icon, the headline metric, the top five fixes with their rewrites, then the export footer) formatted for pasting into an email; "Copy for Slack" copies the same structure as plain text. Both fall back to a plain-text clipboard copy if the browser can't write rich clipboard content.
- **A "Share score" button** reveals two destination controls: "Share to WhatsApp" opens WhatsApp with the message pre-filled (via `wa.me`, since that's a public link); "Share to Slack" copies the message to the clipboard instead, since Slack has no equivalent public link for arbitrary text. The shared text is deliberately short — grade, headline metric, and the tool's own URL only, never the analysed text or a flagged sentence, since anything in a share link is exposed in a URL and that would break the privacy promise at the top of the page.
- **A print stylesheet** (`css/print.css`) strips navigation and buttons from a printed page or PDF export, forces the full report to show regardless of the on-screen detail level, and gives the two highlight categories that rely on background tint alone on screen (long sentence, empty quote) a print-only text label, so every highlight stays legible even printed in greyscale with backgrounds off.

### Interface and accessibility

This round was interface-only — no scoring logic, threshold, word list or calculation changed, only how the same results are presented:

- **Three detail levels** — Glance, Working, and Full — control how much of the same analysis is shown, without re-running it. Glance shows the grade and headline only; Working (the default) adds every check's score plus the top five fixes; Full adds the annotated text and each check's "Why this check exists" sources. The page picks Glance automatically on a narrow (phone-width) screen; a "Detail level" control near the top of the results lets you override it at any time.
- **Weather-scale grades** — A–E map to a sky icon (☀️ Clear, 🌤 Mostly clear, ⛅ Hazy, 🌫 Foggy, 🌧 Murky) instead of a bare letter. A screen reader announces the grade and label together ("Grade B, Mostly clear"), never just the emoji, and the result is also announced automatically when analysis finishes.
- **Colour-blind-safe highlights** — every flagged category in the annotated text uses its own underline *pattern* (dotted, wavy, dashed, or a double line), not colour alone, so the categories stay distinguishable without relying on hue. A solid underline is reserved for real links.
- **Two-column desktop layout, single column on a phone** — your text on the left, scores on the right on a wide screen; it collapses to one column with nothing overlapping on a narrow one.
- Semantic headings in document order, a real `<label>` on the text box, visible keyboard-focus outlines throughout, and every highlighted word and "Why this check exists" control reachable and operable from the keyboard (not just by mouse or touch).
- A Google Font (Inter) and a restrained palette, applied on top of the existing card layout — the layout and colour system itself were built in an earlier round.

**Source links.** A few of the "Why this check exists" panels now link the named source in the text itself, opening in a new tab with an accessible label: the sentence-length rationale links "plain-language guidance" to plainlanguage.gov, the readability rationale links "Flesch-Kincaid" to the freely-available 1975 Kincaid et al. US Navy report on ERIC, and the nominalisation rationale links "Helen Sword" to her *New York Times* piece (via the Times' own archive, since the original Opinionator URL has since moved). Regulated-claims results now also link to the actual regulator for the selected sector (e.g. the ABPI/PMCPA code for healthcare), using the `sourceUrl` already in each sector's config file. The English-variant check's link to Wikipedia's Oxford spelling article was already in place from an earlier round and was left untouched. Two sources named in COPY.md were deliberately **not** added: the Reuters Handbook of Journalism has no live, official, directly-linkable URL that could be verified, and Orwell's "Politics and the English Language" isn't currently named in any on-page rationale text, so there was nowhere to attach it without inventing new copy. This environment blocks general outbound web requests, so every candidate URL above was checked indirectly (via search, not a direct fetch) before being added.

## What each file does (plain English)

- **`index.html`** — The page you open in a browser: the sector selector, the text box, the English-variant selector, the "Analyze" button, and the score cards. It pulls in its styling from `css/` and its logic from `js/` with plain `<link>`/`<script>` tags — no build step, no bundler, no ES modules. There's no separate app to install: you just open this file (or visit the hosted page) — see "Running it locally" below for the one thing that still needs a local server.
- **`docs.html`** — A documentation viewer: renders README.md, SPEC.md, SCORING.md and COPY.md as styled HTML pages instead of sending readers to the raw markdown files, which GitHub Pages serves as plain text because of `.nojekyll` below. README, SPEC and SCORING are picked from its sidebar, or linked directly with e.g. `docs.html?doc=scoring`; COPY.md isn't in the sidebar (it's interface copy, not documentation for a reader), but renders the same way when a link to it is followed from another doc. Its logic is `js/markdown.js` (a small dependency-free markdown-to-HTML converter) and `js/docs.js` (fetches the chosen file and renders it); its styling is `css/docs.css`. Internal links between the four docs (e.g. README's link to SPEC.md) are rewritten to stay inside the viewer.
- **`css/`** — The tool's styling, split by responsibility into plain stylesheets loaded via `<link>` tags in `index.html`: `base.css` (colour/spacing tokens and resets), `layout.css` (header, sector bar, page grid, footer), `forms.css` (the text box, selects, buttons, and the export/share button groups), `cards.css` (the score cards and their Finding/Action/Rationale layout), `view-controls.css` (the Glance/Working/Full detail-level control), `rewrites.css` (worst-offenders and rewrite-suggestion lists), `highlights.css` (the annotated-text legend and highlight colours/patterns), `responsive.css` (the two-column desktop layout, loaded last among the screen stylesheets so its overrides win), `print.css` (loaded with `media="print"`, so it only applies when printing or exporting to PDF — see "Export, share, and print" above), and `docs.css` (the `docs.html` sidebar and rendered-markdown typography, loaded only by that page). Splitting changed nothing about how the page looks on screen — see SCORING.md/COPY.md for what the design itself is doing.
- **`js/`** — The tool's logic, split by responsibility into plain scripts loaded via `<script>` tags in `index.html` (no ES modules, no build step — they share the page's global scope the same way the original single inline script did): `dom.js` (element references and the detail-level control), `config.js` (loading a sector's word-list file), `text-utils.js` (HTML-escaping, tokenising, sentence/paragraph splitting), `grading.js` (letter grades, the weather-icon scale, verdict text), `matchers.js` (the pattern-matching detectors — buzzwords, passive voice, nominalisations, acronyms, dates, quotes…), `structure.js` (headline/lede/boilerplate zone detection, self-reference classification), `consistency.js` (typo/formatting checks and the English-variant check), `analyze.js` (the main scoring engine tying every check together), `render.js` (turning a scored result into the on-page cards, annotated text, and copyable report), `export.js` (building the "Copy for email"/"Copy for Slack" export text and the "Share score" text, all from the same last-analysed result `render.js` keeps around), and `events.js` (wiring up the Analyze/Copy/export/share buttons and highlight-tap handlers — loaded last, since it's the one file that reaches back into `analyze.js`, `render.js` and `export.js`). Two further scripts are loaded only by `docs.html`, not `index.html`: `markdown.js` (the markdown-to-HTML converter) and `docs.js` (the doc-viewer page logic). Splitting changed nothing about what any check does — see SCORING.md for the logic itself.
- **`config/config.json`** — The default word lists and scoring thresholds the tool checks against, kept separate from the code so they're easy to see and edit without touching any programming: buzzwords, hedges, superlatives, company/audience/third-party term lists, irregular verbs, nominalisation mappings, word-swap rewrites, month names, an acronym allowlist, confusable-word groups, British/American spelling pairs, and every numeric threshold each check uses. `config/config.default.json` is an identical copy, matching the naming the sector configs use.
- **`config/config.greenwashing.json`**, **`config/config.healthcare.json`**, **`config/config.ai.json`**, **`config/config.forward-looking.json`** — Same file, same schema, each with its own sector's regulated-claim terms turned on (see SCORING.md for exactly which terms and why). Pick one from the Sector selector at the top of the page, or load one directly by adding e.g. `?config=healthcare` to the page's URL.
- **`SCORING.md`** — The plain-English methodology doc: exactly how every check's score is calculated, what every threshold means, and an honest note on where each check can get it wrong.
- **`COPY.md`** — The canonical source for interface text: exact wording for the privacy note, disclaimer, and the "Why this check exists" rationale strings for nine of the checks, plus tone rules for any copy written to match it.
- **`.nojekyll`** — An empty marker file for GitHub Pages. It tells GitHub "don't run this site through Jekyll (GitHub's default site-builder)" — without it, GitHub Pages can sometimes ignore files that start with an underscore or otherwise mangle a plain static site. It has no effect on how the tool works; it only affects how GitHub hosts it. One side effect: without Jekyll, GitHub Pages serves README.md/SPEC.md/SCORING.md/COPY.md as plain text rather than rendered HTML, which is why `docs.html` exists.
- **`LICENSE`** — The MIT licence, a standard permissive open-source licence saying anyone can use, copy, or modify this code, with no warranty.
- **`SPEC.md`** — The design document this tool is being built from.
- **`README.md`** — This file.

## How to use it

Open `index.html` in a browser (or visit the GitHub Pages link once it's live), pick a sector (or leave it on "General"), pick your English variant, paste your text into the box, and press "Analyze". Changing the sector re-runs the analysis immediately if you've already got text in the box. On a wide screen (desktop/tablet, roughly 900px and up) the page splits into two columns — your text on the left, the scores on the right, so you can scroll the text while the scores stay in view. On a phone it stacks into a single column instead. You'll get:

- A headline count above the grade, then an overall grade (A–F)
- Expandable cards with the detail behind each of the sixteen checks, each broken into a Finding, an Action, and a "Why this check exists" button that reveals the Rationale
- A "worst offenders" list of the specific sentences to fix first
- A "Rewrite suggestions" list — a "Suggested rewrite" where the tool is confident enough to offer one, something "Worth asking yourself" where it isn't
- Your text re-shown with every flagged category highlighted in its own colour (green for the good stuff) — tap a highlight to see why it was flagged
- A "Copy report" button to paste the full summary into an email or chat, plus "Copy for email" and "Copy for Slack" buttons for a shorter grade/headline/top-five-fixes version, and a "Share score" button for sharing just the grade, headline and tool URL to WhatsApp or Slack (see "Export, share, and print" above)
- Your browser's own Print/Save-as-PDF command gives a clean printout of the same report, with no navigation or buttons and no reliance on colour for the highlights (see "Export, share, and print" above)

## Running it locally

The page loads its word lists over a network request (`config/config.json` by default, or whichever file the Sector selector picks, or `config/config.<sector>.json` if you add a `?config=` parameter to the URL), so it **needs to be served by a local web server** — opening the HTML file directly (`file://`) will block that request in most browsers and the tool won't be able to run. For example:

```
npx http-server .
```

then open the printed `http://localhost:...` address.

## Hosting

Intended to be hosted for free on GitHub Pages, serving directly from this repository.
