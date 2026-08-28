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

The emoji must never be the only carrier of meaning. Always pair with the letter and the label in visible text.

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

**Not yet built.** No share button exists in the interface yet — only "Copy report" is implemented. Tracked in README's "Not yet built" list.

Label: **Share score**

Shared text template:

> Clarity score: [Grade] [Label]. [N] buzzwords, [N] concrete facts.
> Scored with [tool URL]

Never include the analysed text or any flagged sentence in a share link. Share links put their contents in a URL, which would send the user's text to Slack or WhatsApp and break the privacy promise made at the top of the page.

---

## Export footer

**Not yet implemented as specified.** The "Copy report" output (`js/render.js`'s `buildReportText`) currently ends with its own line ("comms-clarity-scorer — analysis runs entirely in the browser, nothing uploaded.") instead of this exact copy, and doesn't include a URL. Tracked in README's "Not yet built" list.

> Scored with Comms Clarity Scorer — [URL]
> Runs in your browser. Nothing is uploaded.

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
