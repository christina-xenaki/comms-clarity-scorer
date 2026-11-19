# UI-SPEC.md — Comms Clarity Scorer redesign

Version 1.1 · November 2026 · Direction: "Combined" (forecast card + annotated text with side column + lock privacy note) · Palette: Evergreen

This is a **visual and layout refactor only**. Read it alongside SPEC.md (behaviour) and COPY.md (interface text).

> **Changes in v1.1** (answers to the code review)
> - **Copy scope**: only new and changed strings go into COPY.md. Existing inline strings stay where they are for now (§0, §9).
> - **Scoring and ranking code is off limits**, including `rankWorstOffenders` and `findRewriteForSentence` in render.js (§0).
> - **Push to main is approved**, after tagging the current main as `pre-redesign` (§11).
> - **Export menu keeps the existing "Copy report"** as "Copy full report" (§5).
> - **Share keeps its two existing actions**, as text-only buttons. The Slack and WhatsApp brand logos are removed, so no brand colours are needed (§5).
> - **Long-sentence and empty-quote highlights join the Structure family** and keep their print text labels (§4, §5).
> - **Highlight popovers keep their current behaviour** and are restyled only. Switched-off families leave the tab order (§4).
> - **The grade summary and disclaimer stay as the page shows them today**, not COPY.md's "Not yet implemented" versions (§9).
> - **Docs**: docs.html moves to self-hosted fonts in UI-1. README and SPEC are updated once, at the end (§11).

---

## 0. Ground rules

- **Do not change** scoring logic, `config.json` or any sector config, word lists, or any grade, score, metric or finding the tool produces. The same input must give exactly the same output before and after.
- **Do not move or edit the six scoring files, or `rankWorstOffenders` and `findRewriteForSentence` in render.js.** The rendering markup around them can change; the functions themselves stay exactly where and as they are.
- **Copy**: the new and changed strings in §9 are added to COPY.md and used from there. Do not invent any other copy. **Existing strings written inline in the JS stay where they are in this refactor.** Do not migrate them. If you touch one, add it to a "Copy backlog" list at the end of COPY.md for a later session.
- **Static GitHub Pages.** Plain HTML, CSS and JavaScript. No frameworks, no build step, no `package.json` or `node_modules` committed.
- **No requests to other domains at runtime.** Fonts are self-hosted. Text never leaves the browser.
- **WCAG 2.2 AA.** Every pair in §1 has been checked; keep to the tokens and it stays compliant.
- **British English** in all new text, comments and commit messages.
- **Desktop-optimised**, degrading cleanly to 390px wide.

---

## 1. Design tokens

All colours, type sizes, spacing, radii, shadows and durations live as CSS custom properties in **one** `:root` block (a `tokens.css` file or the top of the main stylesheet). No colour values anywhere else.

### Colour (Evergreen)

| Token | Value | Job | Checked contrast |
|---|---|---|---|
| `--paper` | `#F6F5F1` | Page background | — |
| `--surface` | `#FFFFFF` | Cards, inputs | — |
| `--ink` | `#1A1D1C` | Main text, filled tier pill, fix markers, cloud strokes | 15.6:1 on paper |
| `--muted` | `#565C5A` | Secondary text, rationale, meta | 6.3:1 on paper; 5.3:1 on the darkest grade tint |
| `--line` | `#E4E1DA` | Card borders (decorative only) | — |
| `--line-soft` | `#EEECE6` | Dividers, segmented-control track, rationale pill | — |
| `--control-border` | `#7D8380` | Borders of text box, selects, secondary buttons, selected segment | 3.3:1 or more on every background it sits on |
| `--accent` | `#1E5B50` | **Actions only**: primary buttons, links, focus ring, logo | 7.9:1 with white |
| `--accent-hover` | `#164840` | Primary button hover | 10.3:1 with white |
| `--on-accent` | `#FFFFFF` | Text on accent | — |
| `--accent-soft` | `#E8F0EC` | Privacy callout background | muted text 5.9:1 |
| `--chip-off` | `#F1F0EC` | Highlight chip when switched off | muted text 6.0:1 |
| `--good` | `#2F7D4F` | Strong detail underline | 5.0:1 on white |
| `--word` | `#B07400` | Word choice underline. **Never use for text** | 3.9:1 on white |
| `--claim` | `#B4233C` | Claims underline | 6.5:1 on white |
| `--struct` | `#1F3F80` | Structure underline | 10.1:1 on white |
| `--sun` | `#B7791F` | Sun strokes in weather icons | 3.1:1 or more on every grade tint |
| `--grade-a` | `#FBF3DD` | Forecast card, grade A | muted 6.2:1 |
| `--grade-b` | `#E6F0F3` | Forecast card, grade B | muted 5.9:1 |
| `--grade-c` | `#ECEFF2` | Forecast card, grade C | muted 5.9:1 |
| `--grade-d` | `#E7E8EA` | Forecast card, grade D | muted 5.6:1 |
| `--grade-e` | `#E1E2E5` | Forecast card, grade E | muted 5.3:1 |

If the repo's current button green is within a shade of `#1E5B50`, keep the existing hex as `--accent` and confirm it still gives at least 4.5:1 with white.

**Colour rules**
1. Each colour has one job. The accent is for actions only: never for grades, "good" highlights or tiers.
2. The four highlight colours appear only in annotations, their chips and their legend.
3. Fix tiers are shown by **weight** (filled, outlined, dashed), not by colour.
4. Nothing relies on colour alone: the underline style carries the meaning, colour reinforces it.

### Type

- **Inter** (interface): weights 400, 500, 600, 700. Fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Source Serif 4** (the analysed text, quoted sentences and rewrites): weights 400, 600. Fallback: `Georgia, serif`.
- Self-host latin-subset `.woff2` files in `/assets/fonts/` with their OFL licence files. Get them from the `@fontsource/inter` and `@fontsource/source-serif-4` npm packages; copy only the `.woff2` files needed and commit nothing else from npm. If they can't be fetched, use the fallback stacks and say so.

| Use | Size / line-height | Weight |
|---|---|---|
| Eyebrow labels (uppercase, letter-spacing 0.06em) | 12px | 600 |
| Meta, footer, chip counts | 13px / 1.55 | 400–600 |
| Interface text, buttons, selects | 14px | 500–600 |
| Card body, fix text | 15px / 1.55 | 400 |
| Analysed text | 18px / 1.75, max 68ch | 400 |
| Text headline (first line, if styled) | 27px / 1.3 | 600 |
| Grade letter | 40px / 1 | 700 |
| Headline metric | 48px / 1.08, letter-spacing −0.025em | 700 |

At 767px and below: headline metric 34px, grade letter 32px.

### Spacing, shape, depth, motion

- Spacing scale (px): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Radii: 8 (logo), 10 (buttons, inputs), 14 (fix cards, menus), 16 (document card, text box), 20 (forecast card), 999 (pills, chips).
- `--shadow-sm: 0 1px 2px rgba(20,30,28,.12)` (selected segment) · `--shadow-menu: 0 12px 32px rgba(20,30,28,.14)` (menus).
- `--dur-fast: 120ms` · `--dur: 200ms` · ease-out. All motion off under `prefers-reduced-motion: reduce`.
- Container: max-width 1240px, side padding 32px (16px at 767px and below), centred.

---

## 2. Page structure

The page has two states, **Input** and **Results**. Results **replace** the text box: the text is never shown twice.

### Header (both states)
Full-width white bar with a `--line` bottom border. Its content sits **inside the same 1240px centred container as everything else** (today it is flush against the left edge).
- Left: 32px logo square (`--accent`, white sun icon) + "Comms Clarity Scorer" (17px/700).
- Right: "How scoring works" link to SCORING.md.

### Toolbar (one row, wraps on narrow screens)
Sector select · English variant select · Detail level segmented control (Glance / Working / Full) · flexible space · *(Results only)* Export menu button · *(Results only)* "Score new text" primary button.

### Input state
Centred single column, max-width 760px (toolbar included).
1. Intro line from COPY.md ("Paste a press release or pitch…"), 18px, `--muted`.
2. **Text box card**: white, radius 16, 1px `--control-border`, min-height 320px, padding 24px 28px, Source Serif 17px/1.7, `spellcheck="false"` (the browser's red wavy lines clash with the Claims underline), resize vertical, visible label from COPY.md. A footer strip inside the card shows the word count (13px, `--muted`, right-aligned).
3. Actions row: "Analyse" primary button, right-aligned, min-height 48px. (No "Try an example" button in this refactor; see §11.)
4. **Privacy callout** (see §3).
5. Footer (see below).

### Results state (artboard 4)
Container 1240px.
1. Toolbar.
2. **Forecast card.**
3. **Privacy callout.**
4. Two columns (flex, wrap, gap 32px, align start): **Document card** (`flex: 999 1 600px; min-width: 0`) and **Side column** (`flex: 1 1 340px; max-width: 420px`).
5. Footer.

"Edit text" returns to the Input state with the text kept. "Score new text" returns to the Input state with the box cleared. Changing Sector or English variant keeps the current behaviour.

### Forecast card
- Background: the current grade's tint token (`--grade-a` to `--grade-e`). Radius 20, padding 36px 44px. Three regions in a wrapping row, vertically centred:
  - **Left**: weather icon (inline SVG, 80px, one per grade, see §6) · grade letter (40/700, `--ink`, **not** accent) next to "86/100" (18/600, `--muted`) · the grade's existing condition label (15/600, `--muted`).
  - **Middle** (`flex: 1 1 420px`): eyebrow "Your forecast" · **headline metric** (48/700): this is the primary display · the grade's existing summary sentence (18px, `--muted`).
  - **Right** (top-aligned): "Share score" secondary button with share icon.
- **Share panel** opens inside the card, below the regions: white, radius 14, padding 20px 22px. Eyebrow "What gets shared" · the exact existing share text · a line with a small lock icon: "Only the grade and headline. Never your text." · the existing "Share to WhatsApp" and "Share to Slack" actions as text-only secondary buttons (§5). The trigger has `aria-expanded`. Focus moves into the panel when it opens and back to the trigger when it closes; Esc closes it.

### Document card (Full only)
White, 1px `--line`, radius 16, padding 40px 56px 48px (24px at 767px and below).
- Header row: eyebrow "Your text, annotated · {n} words" · "Edit text" link, right-aligned.
- **Highlight chips**, one per family (§4), in a `role="group"` labelled "Show or hide highlight types". Each chip shows a sample "Aa" with the family's underline, the family name and its count. Chips are toggle buttons with `aria-pressed`, all on by default. Switching a chip off hides that family's underlines in the text; the chip changes to `--chip-off` background, `--muted` text and a dashed border.
- The user's text in Source Serif 18/1.75, max 68ch, paragraphs as entered. Don't add structure detection.
- **Boilerplate**: separated by a 1px dashed `--line` top border, eyebrow "Boilerplate · graded separately", text in `--muted`, 16px.
- **Keep the existing highlight behaviour**: every highlight is focusable and opens its explanation on click or Enter. Restyle it with the tokens; don't rebuild it.
- **Fix markers**: right after a highlight that is one of the top five fixes, add a numbered marker: an 18px `--ink` circle with the white number (11px/600), set as superscript, linking to `#fix-n`, with `aria-label="See fix n"`.

### Side column (Full)
1. "Top five fixes" heading (existing copy) with the count in `--muted`.
2. **Fix cards** (white, 1px `--line`, radius 14, padding 20px 22px, `id="fix-n"`):
   - Header row: marker n · tier pill · check name and detail (13px `--muted`, for example "Long sentence · 41 words").
   - The flagged sentence: Source Serif 15px, `--muted`. If it is over about 25 words, shorten the middle with "…".
   - Suggested Rewrite only: eyebrow "Try" + the rewrite (15px, `--ink`).
   - "Why this check exists": the existing chevron-plus-pill control, restyled with a `--line-soft` pill, 12/500 `--muted` text, min-height 32px and a chevron that rotates 90° when open. The expanded text is 13/1.5 `--muted`, indented 18px. Sources are links with solid underlines.
   - **Tier pills** (12/600, radius 999, padding 3px 10px): **Suggested Rewrite** = filled `--ink`, white text · **Worth Asking Yourself** = 1px solid `--ink` border, `--ink` text · **Flag Only** = 1px dashed `--muted` border, `--muted` text.
3. **What's working** card: a check icon in `--good`, a bold lead phrase, then the sentence.
4. **Boilerplate** card: "Boilerplate" · its grade and "not in main score" · the buzzwords found.

### Detail levels
- **Glance**: toolbar, forecast card, privacy callout. Nothing else.
- **Working**: everything in Glance, plus the top five fixes in a single centred column (max 760px), rationale collapsed. No annotated text.
- **Full**: the two-column layout above, including the annotated text, strengths, boilerplate, rationale and sources.

### Footer (both states)
1px `--line` top border, 13px/1.55 `--muted`. Left (max 720px): the disclaimer from COPY.md and the "How scoring works" link. Right: the "Word lists loaded…" line (moved here from under the button). In the Input state, add a `<details>` disclosure "What it checks" holding the existing checks list.

---

## 3. Components

- **Privacy callout**: `--accent-soft` background, radius 12, padding 16px 20px; an 18px lock icon in `--accent`; the COPY.md privacy note word for word, with its first sentence in bold.
- **Selects and text box**: height 44px (selects), radius 10, 1px `--control-border`, `--surface` background, 14/500.
- **Primary button**: `--accent` background, `--on-accent` text, 14–15/600, radius 10–12, min-height 44px (48px for Analyse), `--accent-hover` on hover.
- **Secondary button**: `--surface` background, 1px `--control-border`, `--ink` text.
- **Segmented control**: `--line-soft` track, radius 12, padding 3px. Segments: min-height 44px, radius 9, 14/500 `--muted`. Selected segment: `--surface` background, 1px `--control-border`, `--shadow-sm`, 600 `--ink`. Uses `aria-pressed`.
- **Focus**: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` on every interactive element. Never remove an outline without a replacement.
- **Target size**: 44px minimum for main controls; nothing interactive smaller than 24×24px.

---

## 4. Highlight families

The nine existing categories already group by underline style. This change consolidates the **colours** to one per style; the underline styles stay as they are.

| Family | Underline | Colour | Existing categories |
|---|---|---|---|
| Strong detail | double, 1px | `--good` | Strength, Concrete detail |
| Word choice | dotted, 2px | `--word` | Buzzword, Hedge word, Nominalisation |
| Claims | wavy, 1.5px | `--claim` | Superlative / absolute claim, Regulated claim |
| Structure | dashed, 1.5px | `--struct` | Passive voice, Acronym (first use), Long sentence, Empty quote, any other dashed or sentence-level category |

- All highlights: `text-underline-offset: 5px; text-decoration-skip-ink: none;`. No background tints.
- **Keep the existing highlight mechanics**: `<mark class="hl" tabindex="0" role="button" aria-describedby=…>`, the `.tip` that screen readers can always read, Click/Enter/Space toggling `.open`, and one tip open at a time. Restyle only: the tip popover uses an `--ink` background, white 13px/1.5 text, radius 10, padding 10px 12px and `--shadow-menu`.
- **Switching a family off** removes its underlines and sets its highlights to `tabindex="-1"`, so keyboard users don't tab through invisible items. Switching it back on restores `tabindex="0"`. Screen-reader tips stay in place.
- The specific category name stays in each highlight's explanation and in the fix cards.
- A solid underline is still reserved for external links.

---

## 5. Export, share and print (Results state)

### Export menu
Secondary button with a download icon, "Export" and a chevron. It has `aria-haspopup="menu"` and `aria-expanded`. The menu: `--surface`, 1px `--line`, radius 14, `--shadow-menu`, width 320px, opening under the button and right-aligned. Items are icon + label + one-line description, min-height 56px:
1. **Copy for email**: "Rich text: grade, headline and top five fixes" (the existing email export)
2. **Copy for Slack**: "Plain text, same structure" (the existing Slack export)
3. **Copy full report**: "Plain text, everything in the report" (the existing "Copy report")
4. *(divider)*
5. **Print or save as PDF**: "Full report, legible in greyscale" (calls `window.print()`)

Keyboard: Enter or Space opens the menu, arrow keys move between items, Esc closes it and returns focus to the button, and a click outside closes it. After copying, announce "Copied for email" or "Copied for Slack" in a polite live region.

**Export content: unchanged.** All three copy exports already exist. Move them into this menu **without changing what they output**. Exports keep using emoji, not SVG, because email clients don't reliably render inline SVG or non-solid underlines. Email and Slack exports **never** include the annotated text.

### Share
Already exists. Keep its two actions and its output exactly as they are: **Share to WhatsApp** (a `wa.me` link) and **Share to Slack** (copies to the clipboard). Both share only the grade, the two counts and the tool URL. **Never** the analysed text or a flagged sentence: share links put their contents in a URL, which would break the privacy promise.
- Move it into the share panel inside the forecast card (§2). The panel shows the exact existing share text under "What gets shared".
- Buttons are **text-only** secondary buttons. **Remove the Slack and WhatsApp brand logos**, which also removes their brand colours from the SVGs. The mock-up's separate "Copy" button is not needed, because Share to Slack already copies.

### Print / PDF (`@media print`, artboard 5)
- A4, 18mm margins, white background, 12pt body, `--ink` text.
- **Hide**: header link, toolbar, all buttons, chips, the share panel, the export menu, "Edit text", the "Why this check exists" controls and the privacy callout. The privacy line moves to the print footer.
- **Print-only heading block**: eyebrow "Comms Clarity Scorer · Report"; an `h1` with the first line of the submitted text (up to 120 characters); meta line "Scored {date} · Sector: {sector} · English: {variant} · {n} words".
- **Forecast card**: 1.5px `--ink` border with no background (browsers drop backgrounds when printing). Keep the icon, grade, headline metric and summary.
- **Order**: forecast → top five fixes → annotated text → what's working → boilerplate → footer. Use CSS `order`; don't duplicate the DOM.
- **Fix markers** print as bracketed superscripts "[1]". Fix cards print as a numbered list separated by 1px rules, each kept whole (`break-inside: avoid`).
- The annotated text keeps its underline styles and colours. Print a legend line above it: "Strong detail (double) · Word choice (dotted) · Claims (wavy) · Structure (dashed)".
- **Keep the existing print text labels** on long-sentence and empty-quote highlights.
- **Change from today**: "Why this check exists" panels are **not** printed, which keeps the PDF short enough to send to an executive. Printing link URLs is therefore only needed for links that remain.
- Rework the existing `print.css` rather than starting a new file. Its `#000` and `#fff` become `--ink` and `--surface`.
- **Footer**: export footer (COPY.md), privacy line and disclaimer, 9pt minimum.
- Must read in greyscale: check with Chrome's print dialog set to Colour → Black and white.

---

## 6. Icons

Inline SVG on a 24px grid, stroke 1.8–2, round caps and joins, `currentColor` except the weather icons.
- **Weather, one per grade** (replace the on-screen emoji; keep emoji in exports): A sun · B sun partly behind a cloud · C cloud with a little sun · D two clouds · E cloud with rain. Sun strokes in `--sun`, cloud and rain strokes in `--ink`. Each has `role="img"` and an `aria-label` with the grade's condition label.
- **Interface**: logo sun, lock, download, chevron-down, chevron-right, share, mail, chat bubble, printer, check, arrow-left. All decorative icons get `aria-hidden="true"`.

---

## 7. Responsive

- **1100px and up**: as described.
- **768–1099px**: the side column narrows to 300px minimum, then wraps below the document (via flex-wrap). The forecast card's regions wrap.
- **767px and below**: container padding 16px; forecast card padding 24px with its regions stacked; toolbar wraps and the segmented control goes full width; document card padding 24px; chips wrap; the export menu becomes full width under its button.
- **390px**: no horizontal scrolling anywhere. Text must reflow at 200% zoom.

---

## 8. Motion

- When results appear, the forecast card and the columns fade in and rise 8px over `--dur`, staggered 40ms.
- Menus and panels fade over `--dur-fast`. Chevrons rotate on expand.
- Nothing loops. Under `prefers-reduced-motion: reduce`, no transitions or transforms.

---

## 9. Copy changes (add to COPY.md before building)

**Changed**
- Button: add "Analyse" to COPY.md and use it. It's currently written inline as "Analyze"; Oxford spelling also keeps -yse.

**New** (proposed: edit here before building if you want different wording)
- "Your forecast"
- "Share score" · "What gets shared" · "Only the grade and headline. Never your text."
- "Export" · "Copy for email" · "Rich text: grade, headline and top five fixes" · "Copy for Slack" · "Plain text, same structure" · "Copy full report" · "Plain text, everything in the report" · "Print or save as PDF" · "Full report, legible in greyscale" · "Copied for email" · "Copied for Slack" · "Copied full report"
- "Score new text" · "Edit text" · "{n} words"
- "Your text, annotated · {n} words" · "Show or hide highlight types"
- Family names: "Strong detail" · "Word choice" · "Claims" · "Structure"
- "Boilerplate · graded separately" · "not in main score" · "What's working" · "Try"
- "What it checks"
- Print: "Comms Clarity Scorer · Report" · "Scored {date} · Sector: {sector} · English: {variant} · {n} words" · "Strong detail (double) · Word choice (dotted) · Claims (wavy) · Structure (dashed)"

**Unchanged**: privacy note, grade labels, tier names, "Why this check exists", "Top five fixes", rationale strings, export footer, share text, "Share to WhatsApp", "Share to Slack".

**Grade summary and disclaimer**: use what the page shows **today**, wherever that text currently lives. COPY.md marks its own disclaimer and short grade note as "Not yet implemented". Leave those for the later copy session and don't implement them in this refactor.

---

## 10. Acceptance checks (every session)

1. The baseline script gives output identical to `tests/baseline.json`.
2. No colour values outside the tokens block. No requests to other domains.
3. Every interactive element can be reached and used with the keyboard, with a visible focus ring.
4. No horizontal scroll at 390px.
5. Print preview in black and white: the four highlight families can still be told apart.
6. The live site works at the end of every session, because main is what GitHub Pages serves.

---

## 11. Repo, git and docs

- **Git**: pushing straight to main is approved, because GitHub Pages serves main. Before UI-0, tag the current main as `pre-redesign` so the whole redesign can be rolled back in one step. If your session can't push tags or to main, say so and wait.
- **docs.html**: in UI-1, switch it to the self-hosted fonts and the tokens. No other redesign of docs.html.
- **README.md and SPEC.md**: update them **once, at the end of UI-4**, to describe the new layout, controls and export menu. Don't edit them every session.
- **Example texts**: none ship in the repo today. UI-0 adds 2–3 fictional releases under `tests/`. **Don't** add a "Try an example" button in this refactor.
