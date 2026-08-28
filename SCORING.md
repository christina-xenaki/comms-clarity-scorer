# How the scoring works

This document explains, in plain English, exactly how every check in the Comms Clarity Scorer is calculated: what it looks for, how the 0–100 sub-score is worked out, what each threshold means, and where the numbers came from.

**Read this if you want to trust the score, tune it, or challenge it.** Nothing here is hidden inside the code — every number below is a `thresholds` or `weights` value in `config.json`, so you can see and change all of them without touching any code.

## The honest bit, up front

This is a rule-based heuristic tool, not a language model and not a grammar checker. It uses word lists and regular-expression pattern matching, not true parsing or understanding. That means:

- **The thresholds and penalty multipliers below are reasonable starting defaults**, chosen by the developer for a first version of this tool. A handful are genuinely sourceable (Flesch-Kincaid, the inverted pyramid convention) and are cited where they are; most of the rest are **not** derived from a statistical study of thousands of real press releases, and say so rather than claiming false precision. Treat scores as a useful, consistent starting point for a conversation — "why is this scoring an F?" — not as an infallible verdict.
- **Every check has known blind spots**, documented in its own section below. Where a check is likely to produce false positives or false negatives, that's called out explicitly rather than glossed over.
- All thresholds live in `config.json` under `thresholds`, and every check's contribution to the overall score lives under `weights`. Edit either and the tool immediately scores differently — no rebuild needed.
- **Disclaimer:** this tool is directional, not authoritative. It does not replace an editor. Regulated-claim flags are a prompt to consult your own legal, compliance, or medical affairs team, not a sign-off. It's tuned for English. A good score does not mean the release is accurate, newsworthy, or that it will earn coverage.

## The headline metric

Above the grade, the tool shows one line in the shape **"11 buzzwords. 2 concrete facts."** — no percentage, no grade, just the two rawest counts side by side. That's deliberately the thesis of the whole tool: a release can be grammatically fine and still be almost entirely marketing filler, and that single line makes the imbalance obvious before you've read a single sub-score. Both counts exclude boilerplate (see below).

## How the overall score is built

Every check produces a sub-score from 0 (worst) to 100 (best). The overall score is a **weighted average** of every active sub-score, using the multipliers in `config.json`'s `weights` object:

```
overall = (score₁×weight₁ + score₂×weight₂ + … ) / (weight₁ + weight₂ + …)
```

Most checks default to a weight of `1`. **Concreteness** and **strengths** default to `2` — a deliberate choice: concreteness because a total absence of concrete detail is "the single biggest red flag" a release can have, and strengths for the same reason in reverse, so the tool visibly rewards good writing and not just penalises bad writing. **Regulated claims** only enters the average at all when a sector config turns it on (see section E below) — off by default, it simply isn't counted, rather than silently scoring 100. Change any weight in `config.json` to rebalance what the tool cares about most, or set a weight to `0` to switch a check off entirely.

The overall score maps to a letter grade the same way school grades usually do: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F below 60.

## Shared building blocks (section A: the denominator problem)

Rating things as a percentage of *every* word is misleading, because function words ("the," "of," "and," "to") make up 40–50% of any text and water down the percentage without meaning anything. So different checks below deliberately use different denominators:

- **Content words**, not total words, for buzzwords, hedging, superlatives, and nominalisation. Content words = every word minus a `stopwords` list of ~130 common function words in `config.json`. A release that's 10% buzzwords-by-content-word is a much stronger signal than 10%-by-total-word would suggest, since content words are the words actually carrying meaning.
- **Per 100 words** (of whichever denominator applies) so a 200-word pitch and a 900-word release are directly comparable — this is just what "density" means throughout this document.
- **Per sentence**, reported alongside density where it's more intuitive to read: buzzword, hedge, and other check cards say things like *"7 of your 14 sentences contain a buzzword"* in addition to the density number.
- **Absolute counts**, not a density, for acronym load specifically — see section 11 below; a percentage doesn't capture "how many distinct acronyms did you never explain," a count does.
- **Clustering.** When enough matches exist (`clusteringMinMatches`, default 3) and one paragraph holds an outsized share of them (`clusteringShareThreshold`, default 40%), the buzzword card adds a line like *"6 of your 11 buzzwords are in paragraph 3."* Paragraphs are detected by blank-line breaks in the pasted text.
- **Boilerplate excluded.** See the dedicated section right below — the trailing "About [Company]" and media-contact block is stripped out of every score and reported on its own, separately.

**Sentence splitting**, used throughout, splits text on `.`, `!`, or `?` followed by whitespace or end-of-text. This is a simple heuristic: it doesn't know about abbreviations like "Inc." or "Dr.", so those occasionally cause a mis-split. It also means a period with **no** following space (a genuine typo, e.g. "…in 2026.The rollout…") doesn't end a sentence for scoring purposes — the sentence keeps running until the next real terminator, which the consistency check (section F) separately flags as a "missing space after full stop" issue. Good enough for scoring; not a substitute for a real sentence tokenizer.

## Boilerplate exclusion

The tool looks at your paragraphs (blank-line-separated blocks) from the end, backwards, and treats any consecutive trailing paragraph as boilerplate if it starts with "About " or contains a contact indicator (`media contact`, `press contact`, `contact:`, `for more information`, or an email address) — configured via `boilerplateHeadingPatterns` and `contactIndicators`. It stops at the first paragraph (from the end) that matches neither.

Everything inside that detected range is **excluded from every check and from the overall score**, but still shown in the annotated text, faded, so you can see what was excluded and why. It gets its own small info card instead, reporting its word count and buzzword count on their own — graded separately, never folded into your main grade, per the spec.

**Known limitation:** if a sentence starts just before the boilerplate boundary but has no terminating punctuation before it (so the sentence-splitter's next terminator lands inside the boilerplate), that sentence's word count for scoring purposes is clipped exactly at the boilerplate boundary — it does not count boilerplate words as part of the sentence's length, even though the same sentence-splitting quirk described above briefly merges the two regions internally.

## The checks

### 1. Concreteness — weight `2`

**What it looks for:** numbers, percentages, currency amounts, and dates anywhere in the (non-boilerplate) text — the raw evidence that a release contains actual facts rather than only impressions. Detected via pattern matching for things like `$3 million`, `42%`, `March 4th`, `2026`, and plain numbers.

**Scoring:**
- Zero concrete signals anywhere in the text → **score is 0**, full stop, regardless of length. This mirrors the spec directly: "a release with zero concrete details is the single biggest red flag."
- Otherwise, the score scales with how many signals appear per 100 words, up to a target (`concretenessTargetPer100Words`, default **3** per 100 words) — hit or exceed the target and you get 100; below it, the score is proportional.

```
score = min(100, (signals per 100 words ÷ target) × 100)
```

**Where the target came from:** 3 concrete details per 100 words is a rough, defensible floor — it means at least one specific fact roughly every couple of sentences. It is a starting heuristic, not a benchmark from analysing real releases.

**Known limitation:** this check cannot detect named specifics that aren't numbers or dates — a named product, a customer name, a place name. Reliably identifying proper nouns needs real named-entity recognition, which is out of scope for a no-backend, regex-based tool.

### 2. Strengths — weight `2` (section B)

**Green highlights, not just red.** Every other check in this tool looks for problems; this one looks for the opposite, and — like concreteness — carries double weight, so the overall score visibly rewards good writing rather than only punishing bad writing. It credits five distinct signals:

1. **Numbers with a baseline** — a number near a comparison phrase from `baselineIndicators` ("up from," "compared to," "versus," …). "Revenue rose to $12m, up from $8m" is more informative than a bare "$12m," and the tool credits the difference.
2. **Named actor + active, precise verb** — a sentence that (a) starts with what looks like a proper name (two-plus capitalised words, or a name followed by Inc/Corp/Ltd/LLC/PLC/Co), (b) contains a verb from the `preciseVerbs` list, and (c) contains no passive-voice match. This is a heuristic proxy for "the structural opposite of passive," not a real parse.
3. **Precise verbs** — matches against `preciseVerbs` (cut, doubled, delayed, acquired, halved, closed, launched, raised, hired, …) wherever they appear, independent of signal 2.
4. **Informative quotes** — a quote that contains a number, a reason-word (`reasonIndicators`: because, since, as a result…), or a decision-word (`decisionIndicators`: decided to, has chosen to…). This overlaps deliberately with the empty-quote detector (a quote can be both "not informative" and "empty" at once — they're two views of the same underlying weakness).
5. **Plain word choices** — an occurrence of the *plain* side of a `wordSwaps` pair (see section C) — e.g. finding "use" credits the writer for not reaching for "leverage."

**Scoring:**
```
score = min(100, (strength signals per 100 content words ÷ target) × 100)
```
with `strengthsTargetPer100ContentWords` defaulting to **4**. There's no zero-floor penalty the way concreteness has one — a release can reasonably have zero of these specific signals and still be perfectly fine, so absence isn't punished as hard as concreteness's absence is.

**What's deliberately not counted as a strength here:** specific timeframes ("from 3 March" vs. "in the coming months") aren't given a separate highlight or score contribution, because a specific date is already exactly what the concreteness check (and its green highlight) rewards — adding a second, overlapping highlight for the same span would just be visual noise. Vague timeframe phrases (`vagueTimeframes`: "in the coming months," "going forward," …) are counted and reported in the Strengths card as a caution, but don't move the score — informational only, to keep the scoring formula from getting any more tangled than it already is.

### 3. Empty quote detector — weight `1` (with Tier-2 guidance — section C)

**The signature feature.** Extracts every quoted span in the text (inside straight `"…"` or curly `"…"` quotation marks) and judges each one independently.

**A quote is flagged "empty" when both are true:**
- It contains **zero** concrete signals (same detector as the concreteness check, above), **and**
- It's at least `emptyQuoteMinWords` words long (default **6** — long enough to be a real sentence, not just a one-word aside like "Yes." or "No").

**Scoring:**
```
score = 100 × (1 − emptyQuotesFound ÷ totalQuotesFound)
```
No quotes in the text at all → score is 100 with a note that the check didn't have anything to evaluate.

**Presentation:** every flagged quote is shown verbatim in its score card under the shareable line *"This quote would work equally well in a press release about a completely different product"* — and, per the Tier-2 rewrite system (section C below), paired with a fixed guided question rather than an invented rewrite: *"A useful quote gives a reason, a number, or a next step. This gives none. Ask your spokesperson why you actually did this."* The tool can identify the problem; only a human can supply what the quote is missing, so it asks rather than guesses.

**Known limitation:** a quote is only recognised if it sits entirely within one paragraph (no line break inside the quotation marks) and is under 600 characters. Genuinely concrete quotes that avoid numbers entirely (naming a specific product or person only) will still be flagged empty, for the same named-entity-detection reason as the concreteness check.

### 4. Buzzword density — weight `1`

**What it looks for:** exact matches (whole-word, case-insensitive) against the `buzzwords` list in `config.json` — words like "synergy," "best-in-class," "cutting-edge." Multi-word phrases like "excited to announce" match as a phrase.

**Scoring:** density-based against **content words** (see the denominator section above) with `target = 0` and `buzzwordPenaltyPerPercent = 12`. Zero tolerance by design — every buzzword counts against the score.

```
score = 100 − max(0, density − 0) × 12
```

**Where the list came from:** the starter list in the original tool spec — 32 terms drawn from common comms/PR jargon complaints. It's the first thing worth editing in `config.json` for your own organisation's pet peeves.

### 5. Sentence length — weight `1`

**What it looks for:** words per sentence, using the sentence splitter described above.

**Scoring:** two things drag the score down independently:
- The **average** sentence length, once it climbs past a "comfortable" baseline (`sentenceLengthComfortableAverage`, default **15** words) — each word of average length above that baseline costs `sentenceLengthPenaltyPerWordOverAverage` (default **2.5**) points.
- The **percentage of sentences** that individually exceed the hard limit (`sentenceLengthLimit`, default **30** words, per the spec) — each percentage-point share of over-limit sentences costs `sentenceLengthPenaltyPerPercentOverLimit` (default **1**) point.

```
score = 100 − max(0, avgLength − 15) × 2.5 − percentOverLimit × 1
```

### 6. Readability — weight `1`

**What it looks for:** the Flesch-Kincaid Grade Level:

```
grade = 0.39 × (words ÷ sentences) + 11.8 × (syllables ÷ words) − 15.59
```

**Source:** Flesch (1948); Kincaid et al. (1975), developed for the US Navy — one of the few numbers in this tool with a real citation, shown in the card itself. Syllables are estimated with a standard vowel-group heuristic (not a dictionary lookup), so it can be off by one syllable on unusual words — normal for this kind of estimator.

**Scoring:** the grade is compared against a target (`targetReadabilityGrade`, default **8** — roughly newspaper level) and penalised above that:

```
score = 100 − max(0, grade − 8) × readabilityPenaltyPerGrade (default 8)
```

### 7. Passive voice — weight `1` (with Tier-1/Tier-2 rewrites — section C)

**What it looks for:** a "to be" verb (`is/are/was/were/be/been/being/am`), optionally followed by an adverb, followed by a word that either ends in "-ed" or appears in the `irregularVerbs` map (for irregular participles like "written," "given," "shown" — the map also stores each one's base verb form, used for the rewrite suggestions below).

**Scoring:** unlike the other checks, this one is explicitly forgiving, per the spec ("some passive voice is fine and occasionally correct"). Only the **percentage of sentences containing at least one passive construction** above an acceptable threshold (`passiveVoiceAcceptablePercent`, default **20%**) costs points:

```
score = 100 − max(0, passivePercent − 20) × passiveVoicePenaltyPerPercent (default 2)
```

**Source note shown in the card:** the 20% threshold is a widely repeated writing convention, not a research finding, and is labelled as such rather than presented as science — claiming otherwise would be exactly the kind of false precision this tool exists to criticise.

**Known limitation:** this is a grammatical heuristic, not a parser. It will occasionally flag an adjective ending in "-ed" as passive (e.g. "we are excited"). It can also miss passive constructions using less common phrasing.

### 8. Hedging & weasel words — weight `1`

**What it looks for:** exact matches against the `hedges` list — "may," "might," "could," "potentially," "aims to," "up to," "a number of," and similar phrases from the spec.

**Scoring:** density-based against content words, target `0.5%` (`hedgeDensityTarget`), penalty `15` points per percentage point over (`hedgePenaltyPerPercent`).

### 9. Superlatives & absolute claims — weight `1` (Tier 3 — flag only)

**What it looks for:** exact matches against `superlativesAndAbsolutes` — "best," "only," "guaranteed," "always," "never," "100%," "unmatched."

**Scoring:** density-based against content words, target `0.5%` (`superlativeDensityTarget`), penalty `15` points per percentage point over (`superlativePenaltyPerPercent`).

**Tier 3, flag only:** per the three-tier rewrite system (section C), no automatic rewrite is offered for superlatives, and the card says so — the fix here is factual or legal ("can you actually prove this is the *best*?"), not a wording choice, so pretending to auto-fix it would be dishonest.

### 10. Nominalisation — weight `1` (with Tier-1 rewrites — section C)

**What it looks for:** a verb turned into a noun, immediately followed by "of" — e.g. "the implementation of" instead of "implementing." Detected as any word ending in `-tion`, `-ment`, `-ance`, or `-ence` followed by "of."

**Scoring:** density-based against content words, target `1%` (`nominalisationDensityTarget`), penalty `10` points per percentage point over (`nominalisationPenaltyPerPercent`). Helen Sword calls these "zombie nouns" — using the verb directly is usually punchier.

### 11. Self-reference ratio — weight `1`

**What it looks for:** how often the text refers to the company itself — "we," "us," "our," "ours," "ourselves," "the company," "the team" — as a share of **all** words (not content words — self-reference words are themselves common function-word-like terms, so the total-word denominator is the more natural comparison here).

**Scoring:** density-based, target `3%` (`selfReferenceDensityTarget`), penalty `6` points per percentage point over (`selfReferencePenaltyPerPercent`) — the gentlest penalty of any density check, since talking about the company that issued the release is completely normal.

**Deliberately not highlighted inline:** "we" and "our" are common enough that highlighting every instance would clutter the annotated text without adding insight. This check reports only the ratio, in its score card.

### 12. Acronym load — weight `1`

**What it looks for:** runs of 2–6 capital letters (`\b[A-Z]{2,6}\b`), excluding a configurable allowlist of acronyms common enough not to need spelling out (CEO, CFO, US, UK, AI, IT, and similar, in `acronymAllowlist`).

**Scoring — absolute counts, not a density (per section A):**
```
score = 100 − neverExpandedCount × acronymNeverExpandedPenaltyEach (default 12)
```
An acronym counts as **expanded** if its full form appears in parentheses next to it anywhere in the text, in either order — "Natural Language Processing (NLP)" or "NLP (Natural Language Processing)" both count. The card reports it exactly as the spec asked: *"Nine acronyms, four never expanded."*

**Known limitation:** this is a capitalisation pattern, not a dictionary of real acronyms — it will flag any all-caps word of the right length, including a company's own all-caps brand name (e.g. "ACME"). Add your own organisation's all-caps terms to `acronymAllowlist` if they shouldn't count. The expansion check is a simple parenthetical-proximity pattern, not true coreference — an expansion phrased differently ("NLP, short for Natural Language Processing,") won't be recognised.

---

## C. The three-tier rewrite system

The **Rewrite suggestions** panel lists concrete fixes, but is explicit about how confident each one is — the tier is shown on every entry, so the tool never implies more certainty than it has.

**Tier 1 — automatic rewrite, shown directly:**
- **Passive with a named agent** ("X was impacted by the delay") → the fragment is swapped to active order ("the delay impacted"). Requires a "by …" phrase to follow the passive verb within the same clause; the participle's base form comes from the `irregularVerbs` map for irregular verbs, or a small rule-based stemmer for regular "-ed" verbs (strip "-ed"; de-double a doubled final consonant, e.g. "stopped"→"stop"; restore a dropped silent "e" for common endings like "-at/-it/-et/-ct", e.g. "completed"→"complete"). **This is an approximation, not a dictionary lookup** — it can get tense agreement wrong (showing "team complete" rather than "team completes") and is flagged in the UI as something to double-check before using.
- **Nominalisations with a known verb** — `nominalisationVerbMap` maps ~35 common nominalised nouns to their verb (implementation→implement, provision→provide, consideration→consider, …; the spec's five examples plus common extensions). "The implementation of the policy" → "implementing the policy."
- **Word swaps** — a direct substitution dictionary, `wordSwaps` in `config.json`: leverage→use, facilitate→help, commence→start, "in order to"→to, "at this point in time"→now, "is designed to"→does, utilise/utilize→use, prior to→before (the spec's exact list).

**Tier 2 — a guided question, no automatic fix:**
- **Passive with no agent** ("Mistakes were made.") → *"Who did it? If you'd rather not say, make that a deliberate choice rather than an accident of grammar."* (verbatim from the spec)
- **Empty quotes** → *"A useful quote gives a reason, a number, or a next step. This gives none. Ask your spokesperson why you actually did this."* (verbatim from the spec)

Neither the passive-agent question nor the empty-quote question tries to guess an answer, because the tool genuinely doesn't know who did it or what the spokesperson meant — asking is more honest than inventing a plausible-sounding fix.

**Tier 3 — flag only, no rewrite offered:** superlatives, absolute claims, and regulated claims. Their card bodies say so explicitly: the fix is factual or legal ("can you back this up?"), not linguistic, so an auto-rewrite would be actively misleading.

---

## D. Inverted pyramid — weight `1`

A single composite check made of four independent sub-signals, each worth `25` points off a 100-point starting score (`invertedPyramidFactDepthPenalty`, `invertedPyramidLedePenalty`, `invertedPyramidQuotePenalty`, `invertedPyramidDensityPenalty`, all default `25`):

1. **Fact depth** — the word-index of the first concrete signal (reusing the concreteness detector). Reported directly: *"Your first specific detail appears at word 187."* Penalised if that's past `factDepthWarningWords` (default **100** words) or if no concrete fact exists anywhere.
2. **Lede completeness** — does the opening sentence carry a "who" and a "when"? "Who" is approximated as a likely proper name (two-plus capitalised words, or a name followed by a corporate suffix like Inc/Corp/Ltd). "When" is a specific date pattern. Penalised if **either** is missing. ("What" isn't checked separately — reliably verifying a sentence states *something* meaningful needs real language understanding, and claiming to check it with a regex would be exactly the false precision this tool tries to avoid.)
3. **Quote position** — flagged if the first quote in the text appears before the first concrete fact, i.e. before any news has actually been stated.
4. **Density decline** — concrete-signal density (per 100 words) is compared between the first and last non-boilerplate paragraphs. Flagged if the last paragraph is *denser* than the first — proper inverted-pyramid structure should thin out toward the end, not thicken.

**Source note shown in the card:** the inverted pyramid itself is a standard, long-established news-writing convention; the four specific checks above are this tool's own operationalisation of that convention, not a cited formula — said plainly rather than dressed up as more rigorous than it is.

---

## E. Regulated claims — off by default, config-driven, weight `1` when active

Five config files ship with the tool, all sharing the exact same schema (word lists, thresholds, weights):

| File | Sector | Regulated claims |
|---|---|---|
| `config.json` / `config.default.json` | Default | Off |
| `config.greenwashing.json` | Environmental claims | carbon neutral, net zero, sustainable, eco-friendly, biodegradable, 100% recyclable, plastic-free, climate positive, offset |
| `config.healthcare.json` | Healthcare / pharma / oncology | cure, breakthrough, safe, proven, well-tolerated, life-saving, miracle, first-in-class, revolutionary |
| `config.ai.json` | Responsible AI | unbiased, fair, explainable, fully autonomous, human-level, hallucination-free, guaranteed accuracy, solved |
| `config.forward-looking.json` | Forward-looking / financial statements | will, expects to, is on track to, anticipates, projects, guidance, confident that |

**Loading a sector config:** append `?config=healthcare` (or `greenwashing`, `ai`, `forward-looking`) to the page URL — `index.html?config=healthcare`. There's no in-page switcher yet (see "Not yet built," below); the URL parameter is the way to test a sector config today. `config.json` (no parameter) loads the default with regulated claims off.

**Scoring, only when `regulatedClaims.enabled` is true:**
```
score = 100 − matchCount × regulatedClaimPenaltyPerMatch (default 15)
```
When disabled (the default), this check is **excluded from the weighted average entirely** — not silently scored 100, genuinely not counted, matching "off by default."

Each sector config also carries a `sectorName`, a `disclaimer` (extending the base disclaimer with sector-specific regulatory context), and a `sourceUrl` pointing at the relevant regulator or code — both shown in the check's own card when active. **None of this is legal advice** — every sector card repeats that a flagged term is a prompt to consult your own legal/compliance/medical-affairs team, not a verdict.

---

## F. Consistency & typos — weight `1`

**Explicitly not a spellchecker.** Bundling a dictionary produces constant noise on brand names, drug names, and surnames, and the browser already spellchecks the text box. This check only looks for mechanical slips and commonly-confused words, each contributing one "issue type" to the score:

```
score = 100 − issueTypesFound × consistencyPenaltyPerIssueType (default 10)
```

(Capped per **type** found, not per instance — ten doubled words count the same as one, since the fix is the same "proofread this" nudge either way.)

What it checks, all against `config.json` lists/patterns:
- **Doubled words** ("the the")
- **Double spaces**
- **Missing space after a full stop** (a letter or digit, then a period, then an immediate capital letter — "…2026.The rollout…")
- **Unclosed quotation marks** — an odd count of straight `"` characters, or a mismatched count of curly `"`/`"`
- **Inconsistent capitalisation** — the same word appearing in two different capitalised forms (e.g. "Acme" and "ACME"), a common tell for a company name typed inconsistently
- **Mixed number formats** — both `1,000`-style and `1000`-style numbers in the same text
- **Mixed date formats** — two or more of month-name, `DD/MM/YYYY`-style, and ISO `YYYY-MM-DD` style in the same text
- **Mixed straight and curly quotes/apostrophes** — both `"`/`'` and `"`/`'`/`'` in the same text, usually a sign of copy-pasting from two different sources

**Commonly-confused words:** `confusionGroups` in `config.json` (its/it's, their/there/they're, affect/effect, principle/principal, complement/compliment, discreet/discrete, practice/practise). The tool only flags a group when **two or more** of its members appear in the text — a reminder to double-check, not a claim that either use is wrong, since determining which spelling is grammatically correct in context needs real parsing, not a word list.

---

## G. English variant — weight `1`

A three-way choice, not two, selectable per-analysis from the dropdown next to the text box: **British (-ise)**, **British Oxford (-ize)**, or **American**. `config.json`'s `defaultEnglishVariant` sets the pre-selected option.

**Why three, not two:** British Oxford spelling — the convention used by Oxford University Press and the OED — uses "-ize" endings (organize, recognize) but *keeps* British "-our"/"-re"/"-ll-" spelling (colour, centre, travelled). A simple British/American toggle would either wrongly flag "organize" as an American spelling, or wrongly accept "color." The three-way choice is the only way to get this right. A configurable `alwaysIseWords` list (advertise, surprise, compromise, exercise, …) excludes words where "-ise" isn't a suffix alternation at all — even Oxford spelling keeps these as "-ise" always.

**What it checks**, all against the variant selected:
- **Spelling**, via `variantWordPairs` — five suffix categories (-our/-or, -re/-er, -ll-/-l-, -ogue/-og, -ence/-ense) that stay British in both British settings and switch only for American, plus the -ise/-ize category that switches for American **and** British Oxford.
- **Title abbreviations**, via `titleAbbreviations` (Dr, Mr, Mrs, Ms, St) — British/Oxford convention drops the full stop ("Dr Jones"), American keeps it ("Dr. Jones").
- **Ambiguous numeric dates** — any `DD/MM/YYYY`-shaped date is flagged regardless of variant, since `03/04/2026` genuinely means different days in British and American convention and there's no way to guess which the writer intended; the suggestion is always to spell out the month.
- **Quotation punctuation** — American convention places a following period/comma *inside* the closing quote; British convention places it *outside* unless the punctuation is actually part of what's quoted. This is necessarily approximate — the tool can't always tell whether trailing punctuation belongs to the quotation, so treat it as a prompt to check, not a definitive verdict.

**Scoring:**
```
score = 100 − mismatchCount × englishVariantPenaltyPerMismatch (default 5)
```

---

## "Worst offenders" ranking

The five sentences shown in "Worst offenders" are ranked by a combined **badness score** per sentence, not by any single check:

```
badness = wordsOverLimit
        + buzzwordsInSentence × 3
        + hedgesInSentence × 2
        + superlativesInSentence × 2
        + nominalisationsInSentence × 2
        + neverExpandedAcronymsInSentence × 1
```

Buzzwords count for the most per instance (×3) because they're the check with zero tolerance; hedges, superlatives, and nominalisation count double; acronyms (only the never-expanded ones) count once. **Passive voice and self-reference are deliberately excluded** — a little of both is normal, so a sentence isn't "worse" just for containing one passive construction or one "we." Sentences with a badness score of 0 don't appear in the list at all. Sentence text shown here (and in the copyable report) is clipped at the boilerplate boundary if it would otherwise run into the excluded block.

## Not yet built

An in-page settings panel for editing word lists without touching `config.json` directly, and an in-page switcher for the four sector regulated-claims configs (currently loaded via a `?config=` URL parameter — see section E). Both are still open items.

## Editing the numbers

Everything above lives in `config.json`. To recalibrate:

- Change a `target` value to make a check stricter (lower target) or more forgiving (higher target).
- Change a `penaltyPerPercent`/`penaltyPerGrade`/`penaltyPerWordOverAverage`/`penaltyEach`/`penaltyPerMismatch`/`penaltyPerIssueType`/`penaltyPerMatch` value to make the score fall faster or slower once past the target.
- Change a value in `weights` to make a check matter more or less to the overall grade, or set it to `0` to turn it off entirely.
- Add or remove words from any list (`buzzwords`, `hedges`, `superlativesAndAbsolutes`, `selfReferenceTerms`, `irregularVerbs`, `nominalisationSuffixes`, `nominalisationVerbMap`, `acronymAllowlist`, `wordSwaps`, `baselineIndicators`, `preciseVerbs`, `vagueTimeframes`, `reasonIndicators`, `decisionIndicators`, `confusionGroups`, `variantWordPairs`, `alwaysIseWords`, `titleAbbreviations`, `stopwords`) to match your own house style or sector.
- Build a new sector config for regulated claims by copying `config.json`, changing `sectorName`/`disclaimer`/`sourceUrl`, and setting `regulatedClaims.enabled: true` with your own `terms` list — then load it with `?config=<yourname>` (matching a file named `config.<yourname>.json`).

No code changes required for any of that — reload the page after editing `config.json` and the new numbers take effect immediately.
