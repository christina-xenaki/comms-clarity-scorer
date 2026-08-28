# CLAUDE.md

Comms Clarity Scorer is a browser-based tool that scores a pasted press release or pitch for writing clarity and lists exactly what's wrong with it.

## Code practices and conventions

- **Plain HTML, CSS and JavaScript. No framework, no build step.** No React/Vue/etc., no bundler, no transpiler, no package manager for the app itself. `index.html` loads styles and scripts with plain `<link>`/`<script>` tags, and `js/` files share the page's global scope rather than using ES modules.
- **All word lists, thresholds and sector-specific content live in config files, never in the code.** Buzzwords, hedges, superlatives, term lists, numeric thresholds, sector-specific regulated-claim terms — all of it belongs in `config/config*.json`, not hardcoded in `js/`. If a check needs a new word or number, add it to the relevant config file, not inline in a matcher.
- **All user-facing strings come from COPY.md, verbatim.** Don't paraphrase, expand, shorten or "improve" copy that's defined there. If new user-facing text is needed, write it to match COPY.md's tone rules and add it to COPY.md in the same change, then reference it from the code — don't invent copy inline.
- **Accessibility to WCAG 2.2 AA is a requirement, not an enhancement.** Every change that touches the UI must keep (or improve) conformance: semantic headings in document order, real `<label>`s, visible keyboard-focus outlines, full keyboard operability for every interactive element (highlights, "Why this check exists" toggles, controls), and correct `aria-label`/live-region behaviour for dynamic results.
- **Underline styles carry specific, fixed meaning:**
  - A **solid** underline means an external link, and nothing else. Never use a solid underline for anything that isn't a real link.
  - **Non-solid** underlines (dotted, wavy, dashed, double, etc.) distinguish highlight categories in the annotated text.
  - **No meaning is ever carried by colour alone** — every colour-coded distinction (highlight categories, grades, statuses) must also be distinguishable by shape, pattern, icon, or text.
- **Tone rules for any copy follow COPY.md**: short, plain sentences; no "not just X, but Y" or "it's not about X, it's about Y" constructions; no em-dash asides stacked into sentences; no "delve", "leverage", "robust", "seamless", "empower", "unlock" (this tool flags those words — using them would be embarrassing); never open a sentence with "Simply" or "Just"; British English throughout the interface regardless of the user's variant setting.

## Documentation must move with the code

Update documentation **in the same commit** as any change that affects it. `README.md`, `SCORING.md` and `SPEC-v2-quality-scorer.md` must never describe behaviour the code no longer has. If you change a check's logic, a threshold, a config schema, or the interface, update the doc(s) that describe it before considering the change done — don't leave that for a follow-up.

## Scoring changes vs. interface changes

- Treat **scoring logic changes** (anything that can change a check's output — thresholds, word lists, formulas, detection logic) and **interface changes** (layout, copy, accessibility, presentation) as separate sessions of work. Don't mix the two in one change.
- After **any** change, verify that the scores produced for the same input are unchanged, unless the change was deliberately a scoring change. Run the tool against a known piece of text before and after the change and compare the grade, headline count, and per-check results — an interface-only change (or any other non-scoring change) must not move a single score.

## Workflow

Commit directly to `main`.
