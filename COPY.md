# COPY.md — interface text

Use these strings verbatim. Do not paraphrase, expand or "improve" them.

**Tone rules for any additional copy you write:**
- Short, plain sentences. Say the thing.
- No "not just X, but Y" constructions. No "it's not about X, it's about Y".
- No em-dash asides stacked into sentences.
- No "delve", "leverage", "robust", "seamless", "empower", "unlock". This is a tool that flags those words. Using them would be embarrassing.
- Never open a sentence with "Simply" or "Just".
- British English throughout the interface, regardless of the user's variant setting.

---

## Privacy note

Page and README, verbatim:

> The analysis runs in your browser, on your device. Your text is never uploaded anywhere, so you can safely paste a draft that hasn't been published yet.

Place at the top of the page, near the input box. Small, but not hidden.

---

## Disclaimer

**Not yet implemented as specified.** The footer currently shows its own short, paraphrased disclaimer text inline (see `index.html`'s `<footer>`) rather than this full version behind a "What this tool can and can't tell you" link, and the short version below isn't shown under the grade. Building this is tracked in README's "Not yet built" list.

Full version. Put it behind a link labelled "What this tool can and can't tell you", in the footer and in the README.

> ### What this tool can and can't tell you
>
> This is a writing checker, not an approval process.
>
> It measures things that can be counted: sentence length, word choice, passive constructions, readability, whether your text contains concrete facts. Those things correlate with clarity. They say nothing about whether your release is accurate, whether the news is worth reporting, or whether a journalist will cover it. A perfectly clear press release about nothing is still about nothing.
>
> The thresholds come from plain-language guidance and news writing convention. Where a number has a published source, the tool links to it. Where a number is a convention rather than a finding, the tool says so.
>
> Regulated claim flags highlight words that attract regulatory attention in certain sectors. They are a prompt to speak to your legal, compliance or medical affairs team. They are not legal advice and they are not sign-off.
>
> Written for English. Results on other languages will be unreliable.
>
> Judgement stays with you.

Short version, shown under the grade:

> A score is a prompt to look again, not a verdict. [What this tool can and can't tell you]

---

## Grades

| Grade | Icon | Label | aria-label |
|---|---|---|---|
| A | ☀️ | Clear | "Grade A, Clear" |
| B | 🌤 | Mostly clear | "Grade B, Mostly clear" |
| C | ⛅ | Hazy | "Grade C, Hazy" |
| D | 🌫 | Foggy | "Grade D, Foggy" |
| E | 🌧 | Murky | "Grade E, Murky" |

On screen, each grade shows an inline SVG weather icon labelled with its condition (UI-SPEC §6). The emoji are used in the copy and share exports. The emoji must never be the only carrier of meaning. Always pair with the letter and the label in visible text.

---

## View names

- **Glance** — "Grade and headline only"
- **Working** — "Scores and the top five fixes"
- **Full** — "Everything, including sources"

---

## Empty state

**Not yet implemented as specified.** The textarea currently shows its own placeholder text ("Paste your press release or pitch here…") instead of this copy. Tracked in README's "Not yet built" list.

Before anything is pasted:

> Paste a press release, pitch or announcement. Nothing is sent anywhere.

---

## Share button

Label: **Share score**. It sits on the forecast card and opens a share panel inside the card.

Share panel:
- Eyebrow: **What gets shared**
- Then the exact text that will be shared (the template below)
- Then, with a small lock icon: **Only the grade and headline. Never your text.**
- Then two text-only buttons: **Share to WhatsApp** and **Share to Slack**

WhatsApp opens with the message pre-filled, since WhatsApp has a public link for that (`wa.me`). Slack has no equivalent public link for arbitrary text, so that button copies the message to the clipboard instead; its feedback text is **Copied! Paste into Slack.**, reverting to its label after a moment.

Shared text template:

> Clarity score: [Grade] [Label]. [N] buzzwords, [N] concrete facts.
> Scored with [tool URL]

Never include the analysed text or any flagged sentence in a share link. Share links put their contents in a URL, which would send the user's text to Slack or WhatsApp and break the privacy promise made at the top of the page.

---

## Export menu

Toolbar button, Results only: **Export**. It opens a menu. Each item has a label and a one-line description:

- **Copy for email**: "Rich text: grade, headline and top five fixes"
- **Copy for Slack**: "Plain text, same structure"
- **Copy full report**: "Plain text, everything in the report" (the former "Copy report")
- **Print or save as PDF**: "Full report, legible in greyscale"

Copy for email and Copy for Slack copy the same short summary, as rich text and as plain text. Structure, both formats:
1. Grade and weather icon
2. The headline metric (e.g. "11 buzzwords. 2 concrete facts.")
3. The top five fixes, each with its rewrite where the tool has one
4. The export footer, verbatim (see below)

Copy feedback: the Export button's label changes for two seconds, with a check icon, and the same words are announced to screen readers:
- **Copied for email**
- **Copied for Slack**
- **Copied full report**

---

## Export footer

Used verbatim, with [URL] resolved to the page's own address, by "Copy for email", "Copy for Slack" and the printed report's footer. "Copy full report" (`js/render.js`'s `buildReportText`) still ends with its own different line ("comms-clarity-scorer — analysis runs entirely in the browser, nothing uploaded.") with no URL.

> Scored with Comms Clarity Scorer — [URL]
> Runs in your browser. Nothing is uploaded.

---

## Print stylesheet

No navigation or buttons appear on a printed page. A print-only heading block opens the report:

- Eyebrow: **Comms Clarity Scorer · Report**
- Heading: the first line of the submitted text, up to 120 characters
- Meta line: **Scored {date} · Sector: {sector} · English: {variant} · {n} words**

A legend line sits above the annotated text:

> Strong detail (double) · Word choice (dotted) · Claims (wavy) · Structure (dashed)

Long sentences and empty quotes share the Structure family's dashed underline, so on paper they also get a text label:

- Long sentence — prefixed **[Long sentence]**
- Empty quote — prefixed **[Empty quote]**

The footer carries the privacy note, the export footer and the disclaimer.

---

## Rationale strings

These are the generic reference notes attached to each check. Same for every user, every time. Small, indented, lower contrast, collapsed by default, visible in Full view.

**Passive voice**
> Passive constructions hide who did the thing. Sometimes that's correct, and sometimes it's convenient. The 20% threshold is a widely repeated writing convention rather than a research finding, so treat it as a prompt rather than a rule.

**Sentence length**
> People scan press releases rather than reading them. Long sentences survive that badly. The 30-word flag follows plain-language guidance rather than a specific study.

**Readability**
> Flesch-Kincaid estimates the US school grade needed to read a text, based on syllable and sentence length. It rewards short words and short sentences. It cannot tell whether the writing is any good.

**Hedging**
> Words like "may", "could", "aims to" and "up to" soften a claim until it stops committing to anything. A little hedging is normal and often necessary. A lot of it usually means the claim can't be supported.

**Nominalisation**
> Turning a verb into a noun drains the action out of a sentence. "The implementation of the policy" is slower than "implementing the policy". Helen Sword calls these zombie nouns.

**Concreteness**
> A release with no numbers, dates or named specifics gives a journalist nothing to quote and nothing to check.

**Inverted pyramid**
> News writing puts the most important information first, so an editor can cut from the bottom without losing the story. If your first concrete fact arrives late, the structure is working against you.

**Superlatives and absolute claims**
> "First", "only", "best" and "leading" are claims of fact. Most need substantiation and some attract regulatory attention. This is a flag only. Whether you can back it up is a factual question, not a wording one.

**Regulated claims**
> These words draw scrutiny in this sector. The flag is a prompt to check with the people who own that risk in your organisation. It is not a compliance decision.

---

## Source links

Link the named sources in the rationale text. **Find and verify each current URL before adding it — do not guess a URL, and remove any link that 404s.**

- Helen Sword on zombie nouns — her New York Times Opinionator piece
- Flesch-Kincaid — the Kincaid et al. 1975 US Navy technical report, which is freely available
- Plain language — plainlanguage.gov, and the UK Government Digital Service style guide
- Inverted pyramid and news structure — the Reuters Handbook of Journalism
- Orwell, "Politics and the English Language" (1946) — hosted free by the Orwell Foundation
- Regulated claims — link each config to its actual regulator: the CMA Green Claims Code for environmental claims, the ABPI Code for healthcare

All external links open in a new tab, with an accessible label stating where they go.

---

## Docs viewer

`docs.html` renders README.md, SPEC.md, SCORING.md and COPY.md as readable pages, instead of linking to raw markdown.

Header, above the document list:

> Comms Clarity Scorer
> Documentation

"Comms Clarity Scorer" links back to `index.html`.

Document list labels (the sidebar):
- **README.md** — Overview
- **SPEC.md** — Specification
- **SCORING.md** — Scoring methodology

COPY.md is not listed in the sidebar — it's interface copy, not documentation for a reader browsing the docs. It's still reachable (and rendered exactly like the other three) when another doc links to it, e.g. README's "quoted verbatim from COPY.md."

Loading state, while a document fetches:

> Loading [file]…

Error state, if a document fails to load:

> Could not load [file]. Try refreshing the page.

---

## Page layout (UI-SPEC §9)

Strings for the redesigned layout. Use verbatim. Further §9 strings are added here when the components that use them are built.

Main button: **Analyse** (replaces the inline "Analyze"; British spelling, and Oxford spelling also keeps -yse).

Toolbar, Results state only: **Score new text**. Returns to the text box with the box cleared.

Annotated text header: **Edit text**. Returns to the text box with the text kept.

Word count under the text box: **{n} words**

Header and footer link to SCORING.md: **How scoring works**

Footer disclosure, Input state only, holding the existing list of checks: **What it checks**

---

## Results components (UI-SPEC §9)

Forecast card eyebrow (also the results heading): **Your forecast**

Annotated text header: **Your text, annotated · {n} words**

Highlight chips: group label **Show or hide highlight types**. One chip per family:
- **Strong detail** (double underline): strengths and concrete details
- **Word choice** (dotted underline): buzzwords, hedge words and nominalisations
- **Claims** (wavy underline): superlatives, absolute claims and regulated claims
- **Structure** (dashed underline): passive voice, first-use acronyms, long sentences and empty quotes

Fix tier for a top fix with neither a suggested rewrite nor a question: **Flag only** (sentence case, matching "Suggested rewrite" and "Worth asking yourself").

Fix marker after a flagged sentence, accessible name: **See fix {n}**

Rewrite eyebrow on fix cards and rewrite suggestions: **Try**

Side column cards: **What's working** (the Strengths check's findings) and **Boilerplate**, with the eyebrow **Boilerplate · graded separately** above the boilerplate in the annotated text and the note **not in main score** on the card.

---

## Check summaries (UI-SPEC v1.4)

Each check card's summary row, and the printed checks list, shows the check's number of findings:

- **No findings**
- **1 finding**
- **{n} findings**

---

## Fix questions

"Worth asking yourself" text for a passive with no agent, on fix cards, in Rewrite suggestions and in all three copy exports. {phrase} is the passive phrase the check matched. On screen, "Passive voice" is set in weight 600 as a lead-in. The exports keep it as plain text.

When the matched phrase is available:

> Passive voice: “{phrase}” doesn't say who did it. If you'd rather not say, make that a deliberate choice rather than an accident of grammar.

Otherwise:

> Passive voice doesn't say who did it. If you'd rather not say, make that a deliberate choice rather than an accident of grammar.

These replace "Who did it? If you'd rather not say, make that a deliberate choice rather than an accident of grammar." That old text is still returned internally by `findRewriteForSentence` in `js/render.js`, which this change leaves alone (UI-SPEC §0), but it is no longer shown or exported.

---

## Copy backlog

Existing strings written inline in the JS, touched during the redesign. They stay inline for now and move here in a later copy session (UI-SPEC §0).

- "Paste some text first." In `js/analyze.js` (alert) and now also `js/events.js`, which shows it inline under the text box.
- "Copied!" The old copy feedback on the export buttons. Replaced by "Copied for email", "Copied for Slack" and "Copied full report" (UI-SPEC §5); no longer used in the code.
- "towards" (was "toward", changed for British English in UI-5):
  - `js/config.js`: "Regulated-claim flags: on (tracked separately, not counted towards the overall grade)."
  - `js/render.js`: "Move detail earlier — your final paragraph is denser than your first, and inverted-pyramid structure should thin towards the end." (inverted pyramid action)
  - `js/render.js`: "Off by default. This check is never counted towards the overall clarity grade above, even when a sector is selected." (regulated claims finding)
  - `js/render.js`: "…This score is tracked separately and does not count towards your overall clarity grade above." (regulated claims finding when a sector is on)
  - `index.html`: the "What it checks" list in the footer, "…never counted towards the overall grade"
- Boilerplate card figures, `js/render.js` (`renderBoilerplateCard`): "{n} words, {n} buzzword(s)". This replaced the old "Boilerplate detected. The trailing "About"/"Notes to editors"/contact block ({n} words, {n} buzzwords) is excluded from every score above and graded here separately, not folded into your main grade." in UI-3.
