# How the scoring works

This document explains, in plain English, exactly how every check in the Comms Clarity Scorer is calculated: what it looks for, how the 0–100 sub-score is worked out, what each threshold means, and where the numbers came from.

**Read this if you want to trust the score, tune it, or challenge it.** Nothing here is hidden inside the code — every number below is a `thresholds` or `weights` value in `config.json`, so you can see and change all of them without touching any code.

## The honest bit, up front

This is a rule-based heuristic tool, not a language model and not a grammar checker. It uses word lists and regular-expression pattern matching, not true parsing or understanding. That means:

- **The thresholds and penalty multipliers below are reasonable starting defaults**, chosen by the developer for a first version of this tool. They are **not** derived from a statistical study of thousands of real press releases. Treat scores as a useful, consistent starting point for a conversation — "why is this scoring an F?" — not as an infallible verdict.
- **Every check has known blind spots**, documented in its own section below. Where a check is likely to produce false positives or false negatives, that's called out explicitly rather than glossed over.
- All thresholds live in `config.json` under `thresholds`, and every check's contribution to the overall score lives under `weights`. Edit either and the tool immediately scores differently — no rebuild needed.

## How the overall score is built

Every check produces a sub-score from 0 (worst) to 100 (best). The overall score is a **weighted average** of all eleven sub-scores, using the multipliers in `config.json`'s `weights` object:

```
overall = (score₁×weight₁ + score₂×weight₂ + … ) / (weight₁ + weight₂ + …)
```

All checks default to a weight of `1`, except **concreteness**, which defaults to `2`. That's a deliberate choice, not an accident: the spec this tool was built from calls a total absence of concrete detail "the single biggest red flag," so it counts twice as much as any other single check toward the final number. Change any weight in `config.json` to rebalance what the tool cares about most — set a weight to `0` to effectively switch a check off.

The overall score maps to a letter grade the same way school grades usually do: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F below 60.

## Shared building blocks

A few things are reused across multiple checks:

- **Word count** — the text is split on runs of letters/numbers/apostrophes/hyphens (`tokenizeWords` in the code). This is what "total words" and "density" figures are measured against.
- **Sentence splitting** — text is split on `.`, `!`, or `?` followed by whitespace. This is a simple heuristic: it doesn't know about abbreviations like "Inc." or "Dr.", so those will occasionally be mis-split into extra "sentences." Good enough for scoring purposes; not a substitute for a real sentence tokenizer.
- **Density-based scoring** — several checks (buzzwords, hedging, superlatives, nominalisation, self-reference, acronym load) work the same way: count matches, express as a percentage of total words ("density"), then:

  ```
  score = 100 − max(0, density − target) × penaltyPerPercent
  ```

  In words: **up to the target density, you lose nothing.** Every percentage point of density above the target costs a fixed number of points, down to a floor of 0. A `target` of `0` means any occurrence at all starts costing points immediately (that's how buzzwords work); a `target` above `0` means a small amount is treated as normal, and only excess is penalised (that's how hedging, superlatives, nominalisation, self-reference, and acronyms work, since a little of each is completely normal writing).

---

## The checks

### 1. Concreteness — weight `2`

**What it looks for:** numbers, percentages, currency amounts, and dates anywhere in the text — the raw evidence that a release contains actual facts rather than only impressions. Detected via pattern matching for things like `$3 million`, `42%`, `March 4th`, `2026`, and plain numbers.

**Scoring:**
- Zero concrete signals anywhere in the text → **score is 0**, full stop, regardless of length. This mirrors the spec directly: "a release with zero concrete details is the single biggest red flag."
- Otherwise, the score scales with how many signals appear per 100 words, up to a target (`concretenessTargetPer100Words`, default **3** per 100 words) — hit or exceed the target and you get 100; below it, the score is proportional.

```
score = min(100, (signals per 100 words ÷ target) × 100)
```

**Where the target came from:** 3 concrete details per 100 words is a rough, defensible floor — it means at least one specific fact roughly every couple of sentences. It is a starting heuristic, not a benchmark from analysing real releases.

**Known limitation:** this check cannot detect named specifics that aren't numbers or dates — a named product, a customer name, a place name. Reliably identifying proper nouns needs real named-entity recognition, which is out of scope for a no-backend, regex-based tool. So a release could contain specific facts (a person's name, a place) that this check doesn't credit. It only catches the numeric/date kind of concreteness.

### 2. Empty quote detector — weight `1`

**The signature feature.** Extracts every quoted span in the text (inside straight `"…"` or curly `"…"` quotation marks) and judges each one independently.

**A quote is flagged "empty" when both are true:**
- It contains **zero** concrete signals (same detector as the concreteness check, above), **and**
- It's at least `emptyQuoteMinWords` words long (default **6** — long enough to be a real sentence, not just an aside).

**Scoring:**
```
score = 100 × (1 − emptyQuotesFound ÷ totalQuotesFound)
```
No quotes in the text at all → score is 100 with a note that the check didn't have anything to evaluate (absence of quotes isn't itself a flaw).

**Presentation:** every flagged quote is shown verbatim in its score card under the line *"This quote would work equally well in a press release about a completely different product"* — the shareable line from the spec — and highlighted in the annotated text.

**Known limitation:** a quote is only recognised if it sits entirely within one paragraph (no line break inside the quotation marks) and is under 600 characters. Genuinely concrete quotes that happen to avoid numbers entirely (e.g. naming a specific product or person only) will still be flagged empty, for the same named-entity-detection reason as the concreteness check.

### 3. Buzzword density — weight `1`

**What it looks for:** exact matches (whole-word, case-insensitive) against the `buzzwords` list in `config.json` — words like "synergy," "best-in-class," "cutting-edge." Multi-word phrases like "excited to announce" match as a phrase.

**Scoring:** density-based (see "Shared building blocks" above) with `target = 0` and `buzzwordPenaltyPerPercent = 12`. Zero tolerance by design — every buzzword counts against the score, and each percentage point of density costs 12 points. A single buzzword in a 100-word release (1% density) costs 12 points; three buzzwords in the same text (3% density) costs 36.

**Where the list came from:** the starter list in the original tool spec — 32 terms drawn from common comms/PR jargon complaints. It's the first thing worth editing in `config.json` for your own organisation's pet peeves.

### 4. Sentence length — weight `1`

**What it looks for:** words per sentence, using the sentence splitter described above.

**Scoring:** two things drag the score down independently:
- The **average** sentence length, once it climbs past a "comfortable" baseline (`sentenceLengthComfortableAverage`, default **15** words) — each word of average length above that baseline costs `sentenceLengthPenaltyPerWordOverAverage` (default **2.5**) points.
- The **percentage of sentences** that individually exceed the hard limit (`sentenceLengthLimit`, default **30** words, per the spec) — each percentage-point share of over-limit sentences costs `sentenceLengthPenaltyPerPercentOverLimit` (default **1**) point.

```
score = 100 − max(0, avgLength − 15) × 2.5 − percentOverLimit × 1
```

The three sentences that most exceed the limit (combined with other issues — see "Worst offenders" below) are surfaced separately so you know exactly which ones to split first.

### 5. Readability — weight `1`

**What it looks for:** the Flesch-Kincaid Grade Level, a well-established readability formula based on average sentence length and average syllables per word:

```
grade = 0.39 × (words ÷ sentences) + 11.8 × (syllables ÷ words) − 15.59
```

Syllables are estimated with a standard vowel-group heuristic (not a dictionary lookup), so it can be off by one syllable on unusual words — normal for this kind of estimator and good enough for a grade-level approximation.

**Scoring:** the grade is compared against a target (`targetReadabilityGrade`, default **8** — roughly newspaper level) and penalised above that:

```
score = 100 − max(0, grade − 8) × readabilityPenaltyPerGrade (default 8)
```

The card also shows a plain-English interpretation of the grade level (e.g. "about the level of a well-written newspaper article") rather than just the raw number, per the spec.

### 6. Passive voice — weight `1`

**What it looks for:** a "to be" verb (`is/are/was/were/be/been/being/am`), optionally followed by an adverb, followed by a word that either ends in "-ed" or appears in the `irregularPastParticiples` list (for irregular verbs like "written," "given," "shown," which don't end in "-ed").

**Scoring:** unlike the other checks, this one is explicitly forgiving, per the spec ("some passive voice is fine and occasionally correct"). Only the **percentage of sentences containing at least one passive construction** above an acceptable threshold (`passiveVoiceAcceptablePercent`, default **20%**) costs points:

```
score = 100 − max(0, passivePercent − 20) × passiveVoicePenaltyPerPercent (default 2)
```

Below the threshold, the card says explicitly that no action is needed — the tool does not treat all passive voice as a failure.

**Known limitation:** this is a grammatical heuristic, not a parser. It will occasionally flag an adjective that happens to end in "-ed" as passive voice (e.g. "we are excited" reads as "are" + "excited," which matches the pattern even though it's not a true passive construction). It can also miss passive constructions that use less common phrasing. Treat the percentage as an estimate.

### 7. Hedging & weasel words — weight `1`

**What it looks for:** exact matches against the `hedges` list — "may," "might," "could," "potentially," "aims to," "up to," "a number of," and similar phrases from the spec, that soften a claim until it stops committing to anything.

**Scoring:** density-based, target `0.5%` (`hedgeDensityTarget`), penalty `15` points per percentage point over that (`hedgePenaltyPerPercent`). A small amount of hedging is normal in careful writing, so a little is free; a lot is penalised more steeply than buzzwords per point, since hedges are rarer in normal text so a high density is a stronger signal.

### 8. Superlatives & absolute claims — weight `1`

**What it looks for:** exact matches against `superlativesAndAbsolutes` — words like "best," "only," "guaranteed," "always," "never," "100%," "unmatched." These are claims that are hard to prove and easy for a journalist or reader to challenge.

**Scoring:** density-based, same shape as hedging: target `0.5%` (`superlativeDensityTarget`), penalty `15` points per percentage point over (`superlativePenaltyPerPercent`).

**Note:** this is a new check added beyond the original spec's nine, at the user's request — there's no spec language to draw a target from, so `0.5%` and `15` were chosen by analogy with the hedging check, which has a similar "a little is normal, a lot is a flag" shape.

### 9. Nominalisation — weight `1`

**What it looks for:** a verb turned into a noun, immediately followed by "of" — the spec's example is "the implementation of" instead of "implementing." Detected as any word ending in `-tion`, `-ment`, `-ance`, or `-ence` followed by "of" (the spec named the first three suffixes; `-ence` was added as the natural counterpart of `-ance`, e.g. "the occurrence of").

**Scoring:** density-based, target `1%` (`nominalisationDensityTarget`), penalty `10` points per percentage point over (`nominalisationPenaltyPerPercent`). Nominalisation is common in business writing generally, so the target is a little more forgiving than hedging or superlatives.

### 10. Self-reference ratio — weight `1`

**What it looks for:** how often the text refers to the company itself — "we," "us," "our," "ours," "ourselves," "the company," "the team" — as a share of all words.

**Scoring:** density-based, target `3%` (`selfReferenceDensityTarget`), penalty `6` points per percentage point over (`selfReferencePenaltyPerPercent`) — the gentlest penalty of any density check, since a press release talking about the company that issued it is completely normal. This check exists to catch the extreme case: a release so inward-looking it barely mentions the reader or the customer at all.

**Deliberately not highlighted inline:** "we" and "our" are common enough in ordinary writing that highlighting every instance would clutter the annotated text without adding insight. This check reports only the ratio, in its score card — not as inline highlights.

### 11. Acronym load — weight `1`

**What it looks for:** runs of 2–6 capital letters (`\b[A-Z]{2,6}\b`), excluding a configurable allowlist of acronyms common enough not to need spelling out (CEO, CFO, US, UK, AI, IT, and similar, in `acronymAllowlist`).

**Scoring:** density-based, target `1.5%` (`acronymDensityTarget`), penalty `10` points per percentage point over (`acronymPenaltyPerPercent`).

**Known limitation:** this is a capitalisation pattern, not a dictionary of real acronyms — it will flag any all-caps word of the right length, including a company's own all-caps brand name or division name (e.g. "ACME"). Add your own organisation's common all-caps terms to `acronymAllowlist` if they shouldn't count.

---

## "Worst offenders" ranking

The five sentences shown in "Worst offenders" are ranked by a combined **badness score** per sentence, not by any single check:

```
badness = wordsOverLimit
        + buzzwordsInSentence × 3
        + hedgesInSentence × 2
        + superlativesInSentence × 2
        + nominalisationsInSentence × 2
        + acronymsInSentence × 1
```

Buzzwords count for the most per instance (×3) because they're the check with zero tolerance; hedges, superlatives, and nominalisation count double; acronyms count once. **Passive voice and self-reference are deliberately excluded from this ranking** — per the checks' own descriptions above, a little of both is normal, so a sentence isn't "worse" just for containing one passive construction or one "we." Sentences with a badness score of 0 don't appear in the list at all.

## Editing the numbers

Everything above lives in `config.json`. To recalibrate:

- Change a `target` value to make a check stricter (lower target) or more forgiving (higher target).
- Change a `penaltyPerPercent`/`penaltyPerGrade`/`penaltyPerWordOverAverage` value to make the score fall faster or slower once past the target.
- Change a value in `weights` to make a check matter more or less to the overall grade, or set it to `0` to turn it off entirely.
- Add or remove words from any list (`buzzwords`, `hedges`, `superlativesAndAbsolutes`, `selfReferenceTerms`, `irregularPastParticiples`, `nominalisationSuffixes`, `acronymAllowlist`) to match your own house style or sector.

No code changes required for any of that — reload the page after editing `config.json` and the new numbers take effect immediately.
