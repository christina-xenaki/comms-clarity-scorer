# comms-clarity-scorer

Paste a press release or pitch, get a clarity score and a list of exactly what's wrong with it.

**No data leaves your browser.** This tool has no server, no account, and no upload — everything runs as JavaScript on your own device. You can paste unreleased or confidential material and it never travels anywhere. (You can check this yourself: open your browser's network tab while using the tool — the only network request it makes is loading `config.json` from this same site.)

## Status: first pass

This is an early, first-pass build. Three of the checks described in the spec are working:

- **Buzzword density** — how much corporate jargon ("synergy", "best-in-class", "cutting-edge"...) is in the text
- **Sentence length** — flags sentences that run too long to skim
- **Readability** — a Flesch-Kincaid grade-level score with a plain-English explanation

The other checks in the spec (passive voice, empty-quote detection, hedging/weasel words, concreteness, nominalisation, and regulated-claim flags) aren't built yet.

## What each file does (plain English)

- **`index.html`** — The entire tool. This one file is the page you open in a browser: the text box, the "Analyze" button, the score cards, and the logic that actually reads your text and scores it. There's no separate app to install and nothing to build — you just open this file (or visit the hosted page).
- **`config.json`** — The word lists the tool checks against, kept separate from the code so they're easy to see and edit without touching any programming. Right now it holds the list of buzzwords to flag, plus a couple of settings (how many words is "too long" for a sentence, and what reading grade level to aim for). If `index.html` can't find or load this file for some reason, it falls back to a built-in copy of the same list so the tool still works.
- **`.nojekyll`** — An empty marker file for GitHub Pages. It tells GitHub "don't run this site through Jekyll (GitHub's default site-builder)" — without it, GitHub Pages can sometimes ignore files that start with an underscore or otherwise mangle a plain static site. It has no effect on how the tool works; it only affects how GitHub hosts it.
- **`LICENSE`** — The MIT licence, a standard permissive open-source licence saying anyone can use, copy, or modify this code, with no warranty.
- **`SPEC-tool-1-quality-scorer.md`** — The original design document this tool is being built from: who it's for, what all the checks should eventually do, and what "done" looks like.
- **`README.md`** — This file.

## How to use it

Open `index.html` in a browser (or visit the GitHub Pages link once it's live), paste your text into the box, and press "Analyze". You'll get:

- An overall grade (A–F) at the top
- Expandable cards with the detail behind each of the three checks
- A "worst offenders" list of the specific sentences to fix first
- Your text re-shown with buzzwords and overly-long sentences highlighted — tap a highlight to see why it was flagged
- A "Copy report" button to paste the summary into an email or chat

## Running it locally

Because the page loads `config.json` via a network request, some browsers block that request if you just double-click the HTML file (`file://` URLs are restricted this way). If the word-list doesn't load, the tool still works using a built-in fallback list — but to get the real `config.json`, serve the folder with any static file server, for example:

```
npx http-server .
```

then open the printed `http://localhost:...` address.

## Hosting

Intended to be hosted for free on GitHub Pages, serving directly from this repository.
