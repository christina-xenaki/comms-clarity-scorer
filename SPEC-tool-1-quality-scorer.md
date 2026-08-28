# Spec — Press Release & Pitch Quality Scorer

**Working repo name:** `comms-clarity-scorer` (alternatives: `pr-jargon-scorer`, `press-release-checker`)

**One-line description:** Paste a press release or pitch, get a clarity score and a list of exactly what's wrong with it.

---

## Who it's for

Comms and PR professionals who suspect their releases are full of corporate mush but can't point to why. Also useful for anyone reviewing someone else's draft who needs to make objective rather than taste-based feedback.

## The problem it solves

Press release quality feedback is usually subjective and therefore hard to win arguments about. A score with highlighted evidence turns "this feels waffly" into "38% of your sentences are passive and your CEO quote contains no concrete information."

---

## Scope for v1

**In:** A single web page. User pastes text. Gets a score, sub-scores, and inline highlighting with explanations. Settings panel to swap in a custom word list.

**Out (v2 or later):** Saving history, comparing drafts, uploading files, AI-generated rewrites, user accounts.

---

## The checks

Each returns a sub-score 0–100 plus a list of flagged spans.

### 1. Buzzword density
Counts matches against a configurable list, as a percentage of total words.

Starter list: leverage, synergy, best-in-class, world-class, cutting-edge, innovative, solution, ecosystem, robust, seamless, empower, unlock, journey, passionate, delighted, thrilled, excited to announce, game-changing, paradigm, disruptive, holistic, strategic, committed to, mission-critical, next-generation, transformative, revolutionise, pioneering, landmark, unparalleled, industry-leading

### 2. Passive voice
Flag `to be` verb + past participle. Report as a percentage of sentences. Some passive voice is fine and occasionally correct — the tool should say so rather than treating all of it as failure.

### 3. Sentence length
Average length, plus the three worst offenders highlighted. Flag anything over 30 words.

### 4. Readability
Flesch-Kincaid grade level. Display the grade with a plain-English interpretation, not just a number.

### 5. Empty quote detector
**The signature feature.** Extract text inside quotation marks and score it for emptiness:
- Contains no numbers or concrete nouns
- High buzzword density
- Could plausibly have been said by any executive at any company about anything

Present as: "This quote would work equally well in a press release about a completely different product." That line is the shareable bit.

### 6. Hedging and weasel words
may, might, could, potentially, aims to, seeks to, helps to, is designed to, up to, as much as, some of the, a number of

### 7. Concreteness check
Does the text contain any numbers, dates, or named specifics at all? A release with zero concrete details is the single biggest red flag and should weigh heavily.

### 8. Nominalisation
Verbs turned into nouns: "the implementation of" rather than "implementing". Flag `-tion of`, `-ment of`, `-ance of` patterns.

### 9. Regulated-claim flags — CONFIG DRIVEN, OPTIONAL
A configurable list of terms that trigger a warning in a given sector. Off by default; enabled by config.

- Pharma/oncology: cure, breakthrough, miracle, safe, guaranteed, proven, first-in-class, life-saving
- Responsible AI: unbiased, fair, safe, guaranteed, fully autonomous, human-level, solved
- Financial services: guaranteed returns, risk-free, outperform

**This is the feature that proves the configurability story.** Two sectors, same code, completely different tool.

---

## Output design

- **Overall grade** at the top — a letter or a score out of 100, with a one-line verdict
- **Sub-score cards** for each check, expandable
- **The text itself**, re-rendered with problems highlighted in different colours by category. Tap or hover a highlight for the explanation.
- **"Worst offenders"** list — the five specific sentences to fix first, ranked
- **Copy report** button so users can paste findings into an email

Mobile-first layout. Full width, single column, big tap targets. Test on a phone before shipping.

---

## Configuration

A single file, `config/config.json`, containing:
- `buzzwords` — array of strings
- `hedges` — array of strings
- `regulatedClaims` — array of strings, plus an `enabled` flag and a `sectorName` label
- `thresholds` — sentence length limit, target readability grade, acceptable passive percentage
- `weights` — how much each check contributes to the overall score

Ship at least three: `config/config.default.json`, `config/config.pharma-oncology.json`, `config/config.responsible-ai.json`.

The settings panel in the UI should let a user paste in or edit lists without touching files, and download their edited config.

---

## Technical approach

- Single static HTML page, plain JavaScript, no build step and no framework
- No API keys, no backend, no data leaves the browser — **state this prominently in the README**, because comms people will be pasting unreleased material and confidentiality is a real objection
- Hosted free on GitHub Pages
- Config loaded from JSON, overridable in-session via the settings panel

## Definition of done

- [ ] Works on a phone browser
- [ ] All nine checks implemented
- [ ] Three example configs
- [ ] README with screenshot and a "no data leaves your browser" note
- [ ] MIT licence
- [ ] Live on GitHub Pages
- [ ] Tested against three real press releases — at least one deliberately terrible one
