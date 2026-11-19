"use strict";

function setScore(id, score) { $(id).textContent = Math.round(score) + "/100"; }

function renderResults(r) {
  elHeadline.textContent = r.buzzMatches.length + " buzzword" + (r.buzzMatches.length === 1 ? "" : "s") + ". " + r.concreteMatches.length + " concrete fact" + (r.concreteMatches.length === 1 ? "" : "s") + ".";

  var gradeLetter = letterGrade(r.overall);
  var overallGradeInfo = GRADE_INFO[gradeLetter];
  elOverallGradeIcon.innerHTML = weatherIconSvg(gradeLetter, overallGradeInfo.label);
  elOverallGradeText.textContent = gradeLetter;
  elOverallGradeScore.textContent = r.overall + "/100";
  elOverallGradeLabel.textContent = overallGradeInfo.label;
  // Screen readers get the grade in full from visually hidden text; the
  // icon, letter, score and label beside it are aria-hidden (UI-SPEC v1.4).
  elOverallGradeSr.textContent = overallGradeInfo.ariaLabel + ". Score " + r.overall + " out of 100.";
  elForecast.setAttribute("data-grade", gradeLetter.toLowerCase());
  elOverallVerdict.textContent = verdictForScore(r.overall);

  renderBoilerplateCard(r);

  setScore("score-concreteness", r.concretenessScore);
  $("body-concreteness").innerHTML = segBody({
    key: "concreteness",
    finding: r.concreteMatches.length + " concrete detail" + (r.concreteMatches.length === 1 ? "" : "s") + " found (numbers, dates, percentages, amounts) &mdash; " + r.signalsPer100.toFixed(1) + " per 100 words.",
    action: r.concreteMatches.length === 0 ? "Add specific numbers, dates, or amounts before this goes out." : (r.concretenessScore < 70 ? "Add a few more specific numbers or dates to strengthen this." : "No action needed."),
    rationale: "A release with no numbers, dates or named specifics gives a journalist nothing to quote and nothing to check."
  });

  setScore("score-strengths", r.strengthsScore);
  $("body-strengths").innerHTML = segBody({
    finding: r.strengthSignalCount + " strength signal" + (r.strengthSignalCount === 1 ? "" : "s") + " found &mdash; " + r.strengthsPer100.toFixed(1) + " per 100 content words." +
      "<ul>" + strengthFindings(r).map(function (f) { return "<li>" + f.html + "</li>"; }).join("") + "</ul>",
    action: r.strengthsScore < 80 ? "Look for more places to add a baseline comparison, a precise verb, or a plain word instead of jargon." : "No action needed — this is doing real work for you.",
    rationale: "Green highlights, not just red — this check exists to credit good writing, not only flag bad writing, so it's weighted as heavily as concreteness. A specific timeframe (e.g. \"from 3 March\" vs. \"in the coming months\") isn't scored separately here, since that's the same underlying signal the concreteness check already rewards.",
    key: "strengths"
  });

  setScore("score-empty-quote", r.emptyQuoteScore);
  if (r.quoteData.length === 0) {
    $("body-empty-quote").innerHTML = segBody({
      key: "empty-quote",
      finding: "No quotations found to evaluate.",
      rationale: "This check only applies once the text includes an attributed quote."
    });
  } else {
    var eqFinding = r.emptyQuotes.length + " of " + r.quoteData.length + " quote" + (r.quoteData.length === 1 ? "" : "s") + " " + (r.emptyQuotes.length === 1 ? "is" : "are") + " empty &mdash; no numbers or concrete nouns, and high on buzzwords.";
    var eqAction = "";
    if (r.emptyQuotes.length > 0) {
      eqAction = "<p class=\"shareable\">\"This quote would work equally well in a press release about a completely different product.\"</p>" +
        "<p class=\"rewrite-question\">A useful quote gives a reason, a number, or a next step. This gives none. Ask your spokesperson why you actually did this.</p><ul>";
      r.emptyQuotes.forEach(function (q) { eqAction += "<li>“" + escapeHtml(q.text.trim()) + "”</li>"; });
      eqAction += "</ul>";
    } else {
      eqAction = "No action needed.";
    }
    $("body-empty-quote").innerHTML = segBody({
      key: "empty-quote",
      finding: eqFinding,
      action: eqAction,
      rationale: "A quote is flagged empty when it contains zero concrete signals (numbers/dates) and is at least 6 words long."
    });
  }

  setScore("score-buzzword", r.buzz.score);
  $("body-buzzword").innerHTML = segBody({
    finding: r.buzzMatches.length + " buzzword match" + (r.buzzMatches.length === 1 ? "" : "es") + " out of " + r.contentWords + " content words &mdash; a density of " + r.buzz.density.toFixed(1) + "%. " +
      sentenceCoveragePhrase(r.buzzMatches, r.sentences, "a buzzword") + describeClustering(r.buzzMatches, r.paragraphs, { clusteringMinMatches: 3, clusteringShareThreshold: 0.4 }, "buzzwords"),
    action: r.buzzMatches.length > 0 ? "Swap them for concrete facts." : "No action needed.",
    rationale: "Buzzwords are vague, overused corporate phrases (e.g. \"synergy\", \"best-in-class\", \"cutting-edge\") that sound impressive but say nothing specific. Density is measured against content words only (stopwords like \"the\"/\"of\"/\"and\" excluded), since they'd otherwise water down the percentage.",
    key: "buzzword"
  });

  setScore("score-sentence-length", r.lengthScore);
  $("body-sentence-length").innerHTML = segBody({
    finding: "Average sentence length: " + r.avgLength.toFixed(1) + " words. " + r.overLimit.length + " of " + r.sentenceData.length + " sentence" + (r.sentenceData.length === 1 ? "" : "s") + " " + (r.overLimit.length === 1 ? "is" : "are") + " over the " + r.limit + "-word guideline.",
    action: r.overLimit.length > 0 ? "Split the longest ones first — see Worst Offenders." : "No action needed.",
    rationale: "People scan press releases rather than reading them. Long sentences survive that badly. The 30-word flag follows " + srcLink("https://www.plainlanguage.gov/", "plainlanguage.gov", "plain-language guidance") + " rather than a specific study.",
    key: "sentence-length"
  });

  setScore("score-readability", r.readScore);
  var gradeInfo = interpretGrade(r.grade);
  $("body-readability").innerHTML = segBody({
    finding: "Flesch-Kincaid grade level: " + (isFinite(r.grade) ? r.grade.toFixed(1) : "n/a") + ". " + gradeInfo.label,
    action: gradeInfo.action,
    rationale: srcLink("https://eric.ed.gov/?id=ED108134", "Kincaid et al. 1975 US Navy readability report, ERIC", "Flesch-Kincaid") + " estimates the US school grade needed to read a text, based on syllable and sentence length. It rewards short words and short sentences. It cannot tell whether the writing is any good.",
    key: "readability"
  });

  setScore("score-passive", r.passiveScore);
  $("body-passive").innerHTML = segBody({
    finding: r.passiveSentenceCount + " of " + r.sentenceData.length + " sentence" + (r.sentenceData.length === 1 ? "" : "s") + " (" + r.passivePercent.toFixed(1) + "%) use passive voice.",
    action: r.passivePercent <= 20 ? "No action needed — some passive voice is fine and occasionally correct." : "Consider rewriting the most prominent ones as active voice — see Rewrite suggestions.",
    rationale: "Passive constructions hide who did the thing. Sometimes that's correct, and sometimes it's convenient. The 20% threshold is a widely repeated writing convention rather than a research finding, so treat it as a prompt rather than a rule.",
    key: "passive"
  });

  setScore("score-hedging", r.hedge.score);
  $("body-hedging").innerHTML = segBody({
    finding: r.hedgeMatches.length + " hedge/weasel word" + (r.hedgeMatches.length === 1 ? "" : "s") + " out of " + r.contentWords + " content words &mdash; a density of " + r.hedge.density.toFixed(1) + "%.",
    action: r.hedge.score < 80 ? "Cut the ones that aren't doing real work." : "No action needed.",
    rationale: "Words like \"may\", \"could\", \"aims to\" and \"up to\" soften a claim until it stops committing to anything. A little hedging is normal and often necessary. A lot of it usually means the claim can't be supported.",
    key: "hedging"
  });

  setScore("score-superlatives", r.superlative.score);
  $("body-superlatives").innerHTML = segBody({
    finding: r.superlativeMatches.length + " superlative or absolute claim" + (r.superlativeMatches.length === 1 ? "" : "s") + " out of " + r.contentWords + " content words &mdash; a density of " + r.superlative.density.toFixed(1) + "%.",
    action: r.superlativeMatches.length > 0 ? "Only keep the ones you can actually prove — cut or soften the rest." : "No action needed.",
    rationale: "\"First\", \"only\", \"best\" and \"leading\" are claims of fact. Most need substantiation and some attract regulatory attention. This is a flag only. Whether you can back it up is a factual question, not a wording one.",
    key: "superlatives"
  });

  setScore("score-nominalisation", r.nominal.score);
  $("body-nominalisation").innerHTML = segBody({
    finding: r.nominalMatches.length + " nominalisation" + (r.nominalMatches.length === 1 ? "" : "s") + " (e.g. \"the implementation of\" instead of \"implementing\") out of " + r.contentWords + " content words.",
    action: r.nominalRewrites.length > 0 ? "Swap for the verb form — see Rewrite suggestions for specific examples." : (r.nominalMatches.length > 0 ? "Swap for the verb form where you can." : "No action needed."),
    rationale: "Turning a verb into a noun drains the action out of a sentence. \"The implementation of the policy\" is slower than \"implementing the policy\". " + srcLink("https://archive.nytimes.com/opinionator.blogs.nytimes.com/2012/07/23/zombie-nouns/", "Helen Sword, “Zombie Nouns,” New York Times", "Helen Sword") + " calls these zombie nouns.",
    key: "nominalisation"
  });

  setScore("score-self-reference", r.selfRefScore);
  var srFinding = r.selfRefCompany + " sentence" + (r.selfRefCompany === 1 ? "" : "s") + " company-facing, " + r.selfRefAudience + " audience-facing, " + r.selfRefThirdParty + " third-party" +
    (r.selfRefUnclassified ? " (" + r.selfRefUnclassified + " with no clear subject match)" : "") +
    ". " + r.selfRefClassified + " of " + r.sentenceData.length + " sentences classified" + (r.selfRefExcludedQuotes ? " — " + r.selfRefExcludedQuotes + " quote sentence" + (r.selfRefExcludedQuotes === 1 ? "" : "s") + " excluded" : "") + ".";
  $("body-self-reference").innerHTML = segBody({
    finding: srFinding,
    action: r.selfRefCompanySharePercent > CONFIG.thresholds.selfReferenceCompanyShareTarget ? "Balance this with more sentences framed around the reader or a third party." : "No action needed.",
    rationale: "Each sentence's subject is classified by which of three word lists appears earliest in its first few words: company-facing (\"we\", \"our\", \"the company\"), audience-facing (\"you\", \"your\", \"customers\"), or third-party (\"analysts\", \"the market\", and similar). Quoted sentences and boilerplate are excluded, since a quote reflects the speaker's framing, not the release's own voice. Reported as sentence counts rather than a percentage of words, since \"subject of the sentence\" is a per-sentence property.",
    key: "self-reference"
  });

  setScore("score-acronym", r.acronymScore);
  $("body-acronym").innerHTML = segBody({
    finding: r.acronymInfo.uniqueCount + " acronym" + (r.acronymInfo.uniqueCount === 1 ? "" : "s") + ", " + r.acronymInfo.neverExpanded.length + " never expanded" + (r.acronymInfo.neverExpanded.length ? " (" + r.acronymInfo.neverExpanded.join(", ") + ")" : "") + ".",
    action: r.acronymInfo.neverExpanded.length > 0 ? "Spell out the never-expanded ones on first use." : "No action needed.",
    rationale: "Only the first use of each acronym is highlighted in the text, to avoid cluttering repeats. An acronym counts as \"expanded\" if its full term appears in parentheses next to it anywhere in the text. Common acronyms in the allowlist (CEO, US, AI, and similar) never need expanding and aren't flagged at all. Acronyms inside boilerplate, contact details, or a \"Notes to editors\"/references block are excluded from this check entirely, since that content is already excluded from your score.",
    key: "acronym"
  });

  setScore("score-inverted-pyramid", r.pyramidScore);
  var ipFinding = "<ul>";
  ipFinding += "<li>" + (r.factDepthWords === null ? "No concrete fact found anywhere in the text." : "Your first specific detail appears at word " + r.factDepthWords + ".") + "</li>";
  ipFinding += "<li>Opening sentence: " + (r.ledeHasWho ? "names a specific who. " : "doesn't clearly name a who. ") + (r.ledeHasWhen ? "Includes a when." : "Doesn't include a when.") + "</li>";
  ipFinding += "<li>" + (r.quoteBeforeNews ? "A quote appears before the news is stated." : "No quote appears before the news is stated.") + "</li>";
  if (r.paragraphs.length >= 2) {
    ipFinding += "<li>Information density: first paragraph " + r.firstParaDensity.toFixed(1) + " concrete details/100 words, last paragraph " + r.lastParaDensity.toFixed(1) + ".</li>";
  }
  ipFinding += "</ul>";
  var ipActions = [];
  if (r.factDepthWords === null || r.factDepthWords > 100) ipActions.push("Move a specific fact earlier — ideally into the first sentence or two.");
  if (!(r.ledeHasWho && r.ledeHasWhen)) ipActions.push("Add a clear who and when to your opening sentence.");
  if (r.quoteBeforeNews) ipActions.push("Lead with what happened, then let people react to it — move the quote later.");
  if (!r.densityDeclineOk) ipActions.push("Move detail earlier — your final paragraph is denser than your first, and inverted-pyramid structure should thin towards the end.");
  setFindings("inverted-pyramid", ipActions.length);
  $("body-inverted-pyramid").innerHTML = segBody({
    finding: ipFinding,
    action: ipActions.length ? ipActions.join(" ") : "No action needed.",
    rationale: "News writing puts the most important information first, so an editor can cut from the bottom without losing the story. If your first concrete fact arrives late, the structure is working against you.",
    key: "inverted-pyramid"
  });

  setScore("score-consistency", r.consistencyScore);
  var csFinding = "";
  if (r.consistencyIssues.length === 0) {
    csFinding = "No consistency issues found (doubled words, spacing, mixed number/date formats, mixed quote styles, unclosed quotes, inconsistent capitalisation).";
  } else {
    csFinding = "<ul>";
    r.consistencyIssues.forEach(function (issue) { csFinding += "<li><strong>" + escapeHtml(issue.type) + "</strong> — " + escapeHtml(issue.detail) + "</li>"; });
    csFinding += "</ul>";
  }
  var confusedGroups = [];
  CONFIG.confusionGroups.forEach(function (group) {
    var present = group.filter(function (w) { return genericPhraseMatches(r.text.slice(0, r.scoringEnd), [w]).length > 0; });
    if (present.length > 1) confusedGroups.push(present.join("/"));
  });
  $("body-consistency").innerHTML = segBody({
    finding: csFinding,
    action: (r.consistencyIssues.length > 0 || confusedGroups.length > 0) ? "Proofread these before sending" + (confusedGroups.length ? " — including a second look at: " + escapeHtml(confusedGroups.join(", ")) : "") + "." : "No action needed.",
    rationale: "Not a spellchecker &mdash; your browser already checks spelling in the text box, and a bundled dictionary would misfire constantly on brand names and surnames. This only looks for mechanical slips and commonly-confused word pairs worth a second look, and only flags a confusion pair when two or more of its members actually appear, as a reminder to double-check, not a claim that either use is wrong.",
    key: "consistency"
  });

  setScore("score-english-variant", r.variantScore);
  var variantLabel = r.variant === "american" ? "American" : (r.variant === "british-oxford" ? "British (Oxford, -ize)" : "British (-ise)");
  var evFinding = "Checking against: <strong>" + variantLabel + "</strong>. ";
  if (r.variantMismatches.length === 0) {
    evFinding += "No spelling, date-format, quote-punctuation, or title-abbreviation mismatches found for this variant.";
  } else {
    evFinding += r.variantMismatches.length + " mismatch" + (r.variantMismatches.length === 1 ? "" : "es") + " found:<ul>";
    r.variantMismatches.slice(0, 10).forEach(function (mm) { evFinding += "<li>“" + escapeHtml(mm.label) + "” &mdash; " + escapeHtml(mm.suggestion) + "</li>"; });
    if (r.variantMismatches.length > 10) evFinding += "<li>&hellip; and " + (r.variantMismatches.length - 10) + " more</li>";
    evFinding += "</ul>";
  }
  $("body-english-variant").innerHTML = segBody({
    finding: evFinding,
    action: r.variantMismatches.length > 0 ? "Fix these to match your selected variant." : "No action needed.",
    rationale: srcLink("https://en.wikipedia.org/wiki/Oxford_spelling", "Oxford spelling on Wikipedia", "British Oxford spelling") + " (–ize) is the convention used by OUP and the OED; it still keeps British –our/–re/–ll– spellings, so this is deliberately a three-way choice, not a two-way one — a simple toggle would wrongly flag “organize.”",
    key: "english-variant"
  });

  setScore("score-regulated-claims", r.regulatedScore);
  var rcRationale = "These words draw scrutiny in this sector. The flag is a prompt to check with the people who own that risk in your organisation. It is not a compliance decision.";
  if (!r.regulatedEnabled) {
    $("body-regulated-claims").innerHTML = segBody({
      finding: "Off by default. This check is never counted towards the overall clarity grade above, even when a sector is selected.",
      action: "Use the Sector selector at the top of the page (Healthcare, Environmental claims, AI, or Forward-looking statements) to check sector-specific regulated terms.",
      rationale: rcRationale,
      key: "regulated-claims"
    });
  } else {
    var rcFinding = "Sector: <strong>" + escapeHtml(CONFIG.sectorName) + "</strong>. " + r.regulatedMatches.length + " regulated term" + (r.regulatedMatches.length === 1 ? "" : "s") + " found" + (r.regulatedMatches.length ? ": " + r.regulatedMatches.map(function (m) { return escapeHtml(m.label); }).join(", ") : "") + ". This score is tracked separately and does not count towards your overall clarity grade above." +
      (CONFIG.sourceUrl ? " Regulator for this sector: " + srcLink(CONFIG.sourceUrl, "regulator for " + CONFIG.sectorName, CONFIG.sourceUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")) + "." : "");
    $("body-regulated-claims").innerHTML = segBody({
      finding: rcFinding,
      action: escapeHtml(CONFIG.disclaimer),
      rationale: rcRationale,
      key: "regulated-claims"
    });
  }

  renderFindingsCounts(r);

  // Top five fixes (UI-SPEC §2 fix cards)
  renderFixCards(r, rankWorstOffenders(r));
  renderWhatsWorking(r);

  renderRewriteSuggestions(r);
  elAnnotated.innerHTML = buildAnnotatedHtml(r);
  elAnnotatedWordCount.textContent = String(tokenizeWords(r.text).length);
  renderChipCounts(r);
  lastReportText = buildReportText(r);
  lastResult = r;

  elAnnouncer.textContent = "Analysis complete. Grade " + overallGradeInfo.ariaLabel.replace("Grade ", "") + ", score " + r.overall + " out of 100. " + elHeadline.textContent;
}

function rankWorstOffenders(r) {
  return r.sentenceData.map(function (d) {
    var overBy = Math.max(0, d.wordCount - r.limit);
    var badness = overBy + d.buzz * 3 + d.hedge * 2 + d.superlative * 2 + d.nominal * 2 + d.acronym;
    return { d: d, badness: badness, overBy: overBy };
  }).filter(function (x) { return x.badness > 0; })
    .sort(function (a, b) { return b.badness - a.badness; })
    .slice(0, 5);
}

// Reuses the same rewrite candidates as renderRewriteSuggestions() — just matched
// back to a specific worst-offender sentence by position, instead of listed loose.
function findRewriteForSentence(r, sentence) {
  function within(x) { return x.start >= sentence.start && x.end <= sentence.end; }
  var found = null;
  r.passiveSplit.withAgent.concat(r.nominalRewrites, r.wordSwapRewrites).some(function (x) {
    if (within(x)) { found = { kind: "rewrite", original: x.original, rewrite: x.rewrite }; }
    return found;
  });
  if (!found) {
    r.passiveSplit.noAgent.some(function (x) {
      if (within(x)) { found = { kind: "question", question: "Who did it? If you'd rather not say, make that a deliberate choice rather than an accident of grammar." }; }
      return found;
    });
  }
  if (!found) {
    r.emptyQuotes.some(function (q) {
      if (within(q)) { found = { kind: "question", question: "A useful quote gives a reason, a number, or a next step. This gives none. Ask your spokesperson why you actually did this." }; }
      return found;
    });
  }
  return found;
}

// ---------- Results components (UI-SPEC §2, §4, §6) ----------

// Weather icons, one per grade (§6). Sun strokes use --sun and cloud and rain
// strokes use --ink via the wx-* classes; clouds are filled with the card's own
// tint so they sit in front of the sun.
var WX_CLOUD = "M7.5 19h9a4 4 0 0 0 .6-7.96 5.5 5.5 0 0 0-10.5 1.2A3.4 3.4 0 0 0 7.5 19z";
function wxSun(cx, cy, r, ray) {
  var d = "";
  for (var i = 0; i < 8; i++) {
    var a = i * Math.PI / 4;
    var x1 = cx + Math.cos(a) * (r + 1.6), y1 = cy + Math.sin(a) * (r + 1.6);
    var x2 = cx + Math.cos(a) * (r + 1.6 + ray), y2 = cy + Math.sin(a) * (r + 1.6 + ray);
    d += "M" + x1.toFixed(2) + " " + y1.toFixed(2) + "L" + x2.toFixed(2) + " " + y2.toFixed(2);
  }
  return "<g class=\"wx-sun\"><circle cx=\"" + cx + "\" cy=\"" + cy + "\" r=\"" + r + "\"></circle><path d=\"" + d + "\"></path></g>";
}
function wxCloud(transform) {
  return "<path class=\"wx-cloud\" d=\"" + WX_CLOUD + "\"" + (transform ? " transform=\"" + transform + "\"" : "") + "></path>";
}
var WEATHER_SHAPES = {
  A: function () { return wxSun(12, 12, 4.2, 2.4); },
  B: function () { return wxSun(9, 8.5, 3.4, 1.8) + wxCloud("translate(2.5 1.5) scale(0.9)"); },
  C: function () { return wxSun(16.5, 6.5, 2.4, 1.4) + wxCloud("translate(-1 0.5)"); },
  D: function () { return wxCloud("translate(5.5 -4.5) scale(0.75)") + wxCloud("translate(-1.5 1)"); },
  E: function () {
    return wxCloud("translate(0 -3.5)") +
      "<path class=\"wx-rain\" d=\"M9 18.5l-1 3M13 18.5l-1 3M17 18.5l-1 3\"></path>";
  }
};
function weatherIconSvg(letter, label) {
  return "<svg class=\"weather-svg\" viewBox=\"0 0 24 24\" role=\"img\" aria-label=\"" + escapeHtml(label) + "\" focusable=\"false\">" +
    WEATHER_SHAPES[letter]() + "</svg>";
}

// The Strengths check's findings, shared by the check card and "What's working"
// so both always show the same words.
function strengthFindings(r) {
  return [
    { count: r.baselineMatches.length, html: r.baselineMatches.length + " number" + (r.baselineMatches.length === 1 ? "" : "s") + " given with a baseline comparison (e.g. \"up from\")" },
    { count: r.activeVoiceSentences.length, html: r.activeVoiceSentences.length + " sentence" + (r.activeVoiceSentences.length === 1 ? "" : "s") + " with a named actor and an active, precise verb" },
    { count: r.preciseVerbMatches.length, html: r.preciseVerbMatches.length + " precise verb" + (r.preciseVerbMatches.length === 1 ? "" : "s") + " (cut, doubled, acquired, launched…)" },
    { count: r.informativeQuotes.length, html: r.informativeQuotes.length + " of " + r.quoteData.length + " quote" + (r.quoteData.length === 1 ? "" : "s") + " give a reason, a number, or a decision" },
    { count: r.plainWordMatches.length, html: r.plainWordMatches.length + " plain word choice" + (r.plainWordMatches.length === 1 ? "" : "s") + " used instead of a jargon alternative" }
  ];
}

function renderWhatsWorking(r) {
  var rows = strengthFindings(r).filter(function (f) { return f.count > 0; });
  elWhatsWorking.hidden = rows.length === 0;
  elWhatsWorkingList.innerHTML = rows.map(function (f) {
    return "<li><svg class=\"working-icon\" aria-hidden=\"true\" focusable=\"false\"><use href=\"#icon-check\"></use></svg><span>" + f.html + "</span></li>";
  }).join("");
}

function renderBoilerplateCard(r) {
  if (!r.boilerplateInfo) { elBoilerplateNote.hidden = true; return; }
  elBoilerplateNote.hidden = false;
  elBoilerplateCounts.textContent = r.boilerplateInfo.words + " words, " + r.boilerplateInfo.buzz + " buzzword" + (r.boilerplateInfo.buzz === 1 ? "" : "s");
  // Same call analyze() uses for the buzzword count, so the list matches it.
  var found = genericPhraseMatches(r.text.slice(r.boilerplate.start, r.boilerplate.end), CONFIG.buzzwords);
  elBoilerplateBuzzwords.innerHTML = found.map(function (m) { return "<li>" + escapeHtml(m.label) + "</li>"; }).join("");
  elBoilerplateBuzzwords.hidden = found.length === 0;
}

// Findings count in each check's summary row (UI-SPEC v1.4, §2).
// Wording from COPY.md: "No findings", "1 finding", "{n} findings".
function findingsLabel(n) {
  if (n === 0) return "No findings";
  if (n === 1) return "1 finding";
  return n + " findings";
}
function setFindings(key, n) { $("findings-" + key).textContent = findingsLabel(n); }

// Itemised checks count the items they flag or credit (the same items they
// highlight or list). Readability and self-reference flag no single items,
// so they count the action they raise, using the same condition as their
// Action text; inverted pyramid is set beside its own actions above.
function renderFindingsCounts(r) {
  setFindings("concreteness", r.concreteMatches.length);
  setFindings("strengths", r.strengthSignalCount);
  setFindings("empty-quote", r.emptyQuotes.length);
  setFindings("buzzword", r.buzzMatches.length);
  setFindings("sentence-length", r.overLimit.length);
  setFindings("readability", interpretGrade(r.grade).action === "No action needed." ? 0 : 1);
  setFindings("passive", r.passiveMatches.length);
  setFindings("hedging", r.hedgeMatches.length);
  setFindings("superlatives", r.superlativeMatches.length);
  setFindings("nominalisation", r.nominalMatches.length);
  setFindings("self-reference", r.selfRefCompanySharePercent > CONFIG.thresholds.selfReferenceCompanyShareTarget ? 1 : 0);
  setFindings("acronym", r.acronymInfo.neverExpanded.length);
  setFindings("consistency", r.consistencyIssues.length);
  setFindings("english-variant", r.variantMismatches.length);
  setFindings("regulated-claims", r.regulatedEnabled ? r.regulatedMatches.length : 0);
}

// Highlight families (§4): which existing category classes belong to each chip.
var HIGHLIGHT_FAMILIES = {
  strong: ["hl-strength", "hl-concrete"],
  word: ["hl-buzz", "hl-hedge", "hl-nominal"],
  claim: ["hl-superlative", "hl-regulated"],
  struct: ["hl-passive", "hl-acronym", "hl-long", "hl-quote"]
};

function renderChipCounts(r) {
  var longCount = r.sentenceData.filter(function (d) { return d.wordCount > r.limit; }).length;
  $("count-strong").textContent = r.concreteMatches.length + r.baselineMatches.length + r.preciseVerbMatches.length + r.plainWordMatches.length;
  $("count-word").textContent = r.buzzMatches.length + r.hedgeMatches.length + r.nominalMatches.length;
  $("count-claim").textContent = r.superlativeMatches.length + r.regulatedMatches.length;
  $("count-struct").textContent = r.passiveMatches.length + r.acronymFirstUse.length + longCount + r.emptyQuotes.length;
}

// Shortens a long flagged sentence in the middle, keeping its start and end.
function shortenMiddle(text) {
  var words = text.trim().split(/\s+/);
  if (words.length <= 25) return text.trim();
  return words.slice(0, 14).join(" ") + " … " + words.slice(-8).join(" ");
}

function tierPill(kind) {
  if (kind === "rewrite") return "<span class=\"tier-pill tier-rewrite\">Suggested rewrite</span>";
  if (kind === "question") return "<span class=\"tier-pill tier-question\">Worth asking yourself</span>";
  return "<span class=\"tier-pill tier-flag\">Flag only</span>";
}

// "Try" line. On a fix card the sentence above is the whole sentence and the
// rewrite covers one phrase, so the phrase being replaced is shown too. In the
// rewrite suggestions the phrase is already shown above, so only the rewrite.
function tryLine(original, rewrite) {
  var from = original === null ? "" :
    "<del class=\"rewrite-original\">" + escapeHtml(original) + "</del> <span class=\"rewrite-arrow\" aria-hidden=\"true\">&rarr;</span> ";
  return "<p class=\"fix-try\"><span class=\"eyebrow\">Try</span> " + from + "<ins class=\"rewrite-new\">" + escapeHtml(rewrite) + "</ins></p>";
}

function renderFixCards(r, ranked) {
  elFixCount.textContent = ranked.length ? String(ranked.length) : "";
  elWorstList.innerHTML = "";
  if (ranked.length === 0) {
    var li = document.createElement("li");
    li.className = "fix-card fix-empty";
    li.textContent = "No standout offenders — nice and tight.";
    elWorstList.appendChild(li);
    return;
  }
  ranked.forEach(function (item, i) {
    var n = i + 1;
    var reasons = [];
    if (item.overBy > 0) reasons.push(item.d.wordCount + " words (" + item.overBy + " over the " + r.limit + "-word limit)");
    if (item.d.buzz > 0) reasons.push(item.d.buzz + " buzzword" + (item.d.buzz === 1 ? "" : "s"));
    if (item.d.hedge > 0) reasons.push(item.d.hedge + " hedge word" + (item.d.hedge === 1 ? "" : "s"));
    if (item.d.superlative > 0) reasons.push(item.d.superlative + " superlative" + (item.d.superlative === 1 ? "" : "s"));
    if (item.d.nominal > 0) reasons.push(item.d.nominal + " nominalisation" + (item.d.nominal === 1 ? "" : "s"));
    if (item.d.acronym > 0) reasons.push(item.d.acronym + " un-expanded acronym" + (item.d.acronym === 1 ? "" : "s"));
    var found = findRewriteForSentence(r, item.d.sentence);
    var li2 = document.createElement("li");
    li2.className = "fix-card";
    li2.id = "fix-" + n;
    li2.tabIndex = -1;
    li2.innerHTML =
      "<div class=\"fix-head\"><span class=\"fix-number\" aria-hidden=\"true\">" + n + "</span>" + tierPill(found && found.kind) +
      "<span class=\"fix-detail\">" + escapeHtml(reasons.join(" · ")) + "</span></div>" +
      "<p class=\"fix-sentence\">" + escapeHtml(shortenMiddle(item.d.clippedText)) + "</p>" +
      (found && found.kind === "rewrite" ? tryLine(found.original, found.rewrite) : "") +
      (found && found.kind === "question" ? "<p class=\"fix-question\">" + escapeHtml(found.question) + "</p>" : "");
    elWorstList.appendChild(li2);
  });
}

function renderRewriteSuggestions(r) {
  elRewriteList.innerHTML = "";
  var items = [];
  function rewriteItem(x) {
    return { html: tierPill("rewrite") + "<p class=\"fix-sentence\">" + escapeHtml(x.original) + "</p>" + tryLine(null, x.rewrite) };
  }

  r.passiveSplit.withAgent.slice(0, 4).forEach(function (x) { items.push(rewriteItem(x)); });
  r.nominalRewrites.slice(0, 4).forEach(function (x) { items.push(rewriteItem(x)); });
  r.wordSwapRewrites.slice(0, 4).forEach(function (x) { items.push(rewriteItem(x)); });
  r.passiveSplit.noAgent.slice(0, 3).forEach(function (x) {
    items.push({ html: tierPill("question") +
      "<p class=\"fix-sentence\">" + escapeHtml(x.label) + "</p><p class=\"fix-question\">Who did it? If you'd rather not say, make that a deliberate choice rather than an accident of grammar.</p>" });
  });
  r.emptyQuotes.slice(0, 3).forEach(function (q) {
    items.push({ html: tierPill("question") +
      "<p class=\"fix-sentence\">“" + escapeHtml(q.text.trim()) + "”</p><p class=\"fix-question\">A useful quote gives a reason, a number, or a next step. This gives none. Ask your spokesperson why you actually did this.</p>" });
  });

  if (items.length === 0) {
    elRewriteList.innerHTML = "<li class=\"fix-card fix-empty\">No automatic rewrite suggestions for this text — that's a good sign.</li>";
    return;
  }
  items.slice(0, 8).forEach(function (item) {
    var li = document.createElement("li");
    li.className = "fix-card";
    li.innerHTML = item.html;
    elRewriteList.appendChild(li);
  });
}

function buildAnnotatedHtml(r) {
  var text = r.text;
  var ranges = [];
  var tipCounter = 0;

  if (r.boilerplate) {
    ranges.push({ start: r.boilerplate.start, end: r.boilerplate.end, priority: -1, cls: "boilerplate-text", tooltip: null, plain: true });
  }
  r.sentenceData.forEach(function (d) {
    if (d.wordCount > r.limit) {
      ranges.push({ start: d.sentence.start, end: d.sentence.end, priority: 0, cls: "hl-long", tooltip: d.wordCount + " words &mdash; over the " + r.limit + "-word guideline. Consider splitting this sentence." });
    }
  });
  r.emptyQuotes.forEach(function (q) {
    ranges.push({ start: q.start, end: q.end, priority: 1, cls: "hl-quote", tooltip: "This quote would work equally well in a press release about a completely different product." });
  });
  r.regulatedMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-regulated", tooltip: "Regulated claim: \"" + escapeHtml(m.label) + "\" &mdash; check with legal/compliance before publishing." });
  });
  r.buzzMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-buzz", tooltip: "Buzzword: \"" + escapeHtml(m.label) + "\" &mdash; vague corporate language. Try a concrete alternative." });
  });
  r.hedgeMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-hedge", tooltip: "Hedge word: \"" + escapeHtml(m.label) + "\" &mdash; softens the claim until it says very little." });
  });
  r.superlativeMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-superlative", tooltip: "Superlative/absolute claim: \"" + escapeHtml(m.label) + "\" &mdash; hard to prove, easy to challenge." });
  });
  r.passiveMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-passive", tooltip: "Passive voice: \"" + escapeHtml(m.label) + "\" &mdash; consider naming who's doing the action." });
  });
  r.nominalMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-nominal", tooltip: "Nominalisation: \"" + escapeHtml(m.label) + "\" &mdash; a verb turned into a noun. The verb form is usually punchier." });
  });
  r.acronymFirstUse.forEach(function (m) {
    var expanded = r.acronymInfo.neverExpanded.indexOf(m.label) === -1;
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-acronym", tooltip: "Acronym (first use): \"" + escapeHtml(m.label) + "\"" + (expanded ? " — expanded elsewhere in the text." : " — never expanded. Spell it out on first use.") });
  });
  r.concreteMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-concrete", tooltip: "Concrete detail &mdash; numbers, dates and specifics give readers something to trust." });
  });
  r.baselineMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-strength", tooltip: "Strength: a number with a baseline for comparison &mdash; more informative than a bare figure." });
  });
  r.preciseVerbMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-strength", tooltip: "Strength: a precise, concrete verb." });
  });
  r.plainWordMatches.forEach(function (m) {
    ranges.push({ start: m.start, end: m.end, priority: 2, cls: "hl-strength", tooltip: "Strength: a plain word chosen over a jargon alternative." });
  });

  if (ranges.length === 0) return escapeHtml(text);

  // Fix markers (§2): fixes are whole sentences, so each top-five fix gets a
  // numbered marker at the end of its sentence, before any trailing space.
  var markersAt = {};
  rankWorstOffenders(r).forEach(function (item, i) {
    var pos = item.d.sentence.start + item.d.clippedText.replace(/\s+$/, "").length;
    (markersAt[pos] = markersAt[pos] || []).push(i + 1);
  });

  var points = {};
  points[0] = true;
  points[text.length] = true;
  ranges.forEach(function (rr) { points[rr.start] = true; points[rr.end] = true; });
  Object.keys(markersAt).forEach(function (pos) { points[pos] = true; });
  var cuts = Object.keys(points).map(Number).sort(function (a, b) { return a - b; });

  var html = "";
  for (var i = 0; i < cuts.length - 1; i++) {
    var segStart = cuts[i], segEnd = cuts[i + 1];
    if (segStart >= segEnd) continue;
    var active = ranges.filter(function (rr) { return rr.start <= segStart && rr.end >= segEnd; });
    active.sort(function (a, b) { return a.priority - b.priority || a.start - b.start || b.end - a.end; });
    var segText = escapeHtml(text.slice(segStart, segEnd));
    if (r.boilerplate && segStart === r.boilerplate.start) {
      html += "<span class=\"boilerplate-divider eyebrow\">Boilerplate · graded separately</span>";
    }

    var isBoilerplateOnly = active.length && active[0].plain && active.every(function (a) { return a.plain; });
    if (isBoilerplateOnly) {
      html += "<span class=\"boilerplate-text\">" + segText + "</span>" + fixMarkersHtml(markersAt[segEnd]);
      continue;
    }

    var open = "", close = "";
    var wrapBoilerplate = active.some(function (a) { return a.plain; });
    if (wrapBoilerplate) open += "<span class=\"boilerplate-text\">";
    var nonPlain = active.filter(function (a) { return !a.plain; });
    var tipId = nonPlain.length ? "hl-tip-" + (tipCounter++) : null;
    nonPlain.forEach(function (rr) {
      var isFirstFragment = segStart === rr.start;
      open += "<mark class=\"hl " + rr.cls + "\" tabindex=\"0\" role=\"button\"" + (tipId ? " aria-describedby=\"" + tipId + "\"" : "") + (isFirstFragment ? " data-first-frag=\"true\"" : "") + ">";
      close = "</mark>" + close;
    });
    if (wrapBoilerplate) close += "</span>";

    var tip = tipId ? "<span class=\"tip\" id=\"" + tipId + "\">" + nonPlain[nonPlain.length - 1].tooltip + "</span>" : "";
    html += open + segText + tip + close + fixMarkersHtml(markersAt[segEnd]);
  }
  return html;
}

function fixMarkersHtml(numbers) {
  if (!numbers) return "";
  return numbers.map(function (n) {
    return "<sup class=\"fix-sup\"><a class=\"fix-marker\" href=\"#fix-" + n + "\" aria-label=\"See fix " + n + "\">" + n + "</a></sup>";
  }).join("");
}

function buildReportText(r) {
  var lines = [];
  lines.push("Comms Clarity Scorer report");
  lines.push(r.buzzMatches.length + " buzzwords. " + r.concreteMatches.length + " concrete facts.");
  lines.push("Overall: " + letterGrade(r.overall) + " (" + r.overall + "/100) — " + verdictForScore(r.overall));
  lines.push("");
  lines.push("Concreteness: " + Math.round(r.concretenessScore) + "/100");
  lines.push("Strengths: " + Math.round(r.strengthsScore) + "/100");
  lines.push("Empty quote detector: " + Math.round(r.emptyQuoteScore) + "/100 — " + r.emptyQuotes.length + "/" + r.quoteData.length + " quotes empty");
  lines.push("Buzzword density: " + Math.round(r.buzz.score) + "/100 — " + r.buzzMatches.length + " matches");
  lines.push("Sentence length: " + Math.round(r.lengthScore) + "/100 — average " + r.avgLength.toFixed(1) + " words");
  lines.push("Readability: " + Math.round(r.readScore) + "/100 — grade " + (isFinite(r.grade) ? r.grade.toFixed(1) : "n/a"));
  lines.push("Passive voice: " + Math.round(r.passiveScore) + "/100 — " + r.passivePercent.toFixed(1) + "%");
  lines.push("Hedging: " + Math.round(r.hedge.score) + "/100");
  lines.push("Superlatives/absolutes: " + Math.round(r.superlative.score) + "/100");
  lines.push("Nominalisation: " + Math.round(r.nominal.score) + "/100");
  lines.push("Self-reference: " + Math.round(r.selfRefScore) + "/100 — " + r.selfRefCompany + " company-facing, " + r.selfRefAudience + " audience-facing, " + r.selfRefThirdParty + " third-party sentences");
  lines.push("Acronym load: " + Math.round(r.acronymScore) + "/100 — " + r.acronymInfo.neverExpanded.length + " never expanded");
  lines.push("Inverted pyramid: " + Math.round(r.pyramidScore) + "/100");
  lines.push("Consistency: " + Math.round(r.consistencyScore) + "/100 — " + r.consistencyIssues.length + " issue type(s)");
  lines.push("English variant (" + r.variant + "): " + Math.round(r.variantScore) + "/100 — " + r.variantMismatches.length + " mismatch(es)");
  if (r.regulatedEnabled) lines.push("Regulated claims (not counted in the overall grade): " + Math.round(r.regulatedScore) + "/100 — " + r.regulatedMatches.length + " term(s)");
  lines.push("");
  lines.push("Top fixes:");
  var ranked = rankWorstOffenders(r);
  if (ranked.length === 0) {
    lines.push("- None — nice and tight.");
  } else {
    ranked.forEach(function (item, i) {
      lines.push((i + 1) + ". " + item.d.clippedText.trim());
      var rewrite = findRewriteForSentence(r, item.d.sentence);
      if (rewrite && rewrite.kind === "rewrite") {
        lines.push("   Suggested rewrite: " + rewrite.original + " -> " + rewrite.rewrite);
      } else if (rewrite && rewrite.kind === "question") {
        lines.push("   Worth asking yourself: " + rewrite.question);
      }
    });
  }
  lines.push("");
  lines.push("comms-clarity-scorer — analysis runs entirely in the browser, nothing uploaded.");
  return lines.join("\n");
}
