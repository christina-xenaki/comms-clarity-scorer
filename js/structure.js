"use strict";

// ---------- Structural zones (change 1): headline, lede, boilerplate/notes-to-editors/references ----------

function detectBoilerplate(text, paragraphs, config) {
  if (paragraphs.length === 0) return null;
  var idx = paragraphs.length - 1;
  var boundary = null;
  while (idx >= 0) {
    var p = paragraphs[idx];
    var lower = p.text.toLowerCase().trim();
    var isHeading = config.boilerplateHeadingPatterns.some(function (pat) { return lower.indexOf(pat) === 0; });
    var isContact = config.contactIndicators.some(function (ind) { return lower.indexOf(ind) !== -1; }) ||
      /[\w.+-]+@[\w-]+\.[\w.-]+/.test(p.text);
    if (isHeading || isContact) { boundary = p.start; idx--; } else break;
  }
  return boundary === null ? null : { start: boundary, end: text.length };
}

function detectZones(text, paragraphs, sentences, config) {
  var headline = null;
  if (paragraphs.length > 0) {
    var first = paragraphs[0];
    var singleLine = first.text.indexOf("\n") === -1;
    var wc = tokenizeWords(first.text).length;
    if (singleLine && wc > 0 && wc <= 20) headline = { start: first.start, end: first.end };
  }
  var bodyStart = headline ? headline.end : 0;
  var lede = null;
  for (var i = 0; i < sentences.length; i++) {
    if (sentences[i].start >= bodyStart) { lede = sentences[i]; break; }
  }
  var boilerplate = detectBoilerplate(text, paragraphs, config);
  return { headline: headline, lede: lede, boilerplate: boilerplate, bodyStart: bodyStart };
}

function describeClustering(matches, paragraphs, thresholds, itemLabel) {
  if (matches.length < thresholds.clusteringMinMatches || paragraphs.length < 2) return "";
  var counts = paragraphs.map(function () { return 0; });
  matches.forEach(function (m) {
    var idx = findParagraphIndex(paragraphs, m.start);
    if (idx >= 0) counts[idx]++;
  });
  var maxCount = Math.max.apply(null, counts);
  var maxIdx = counts.indexOf(maxCount);
  if (maxCount >= 2 && maxCount / matches.length >= thresholds.clusteringShareThreshold) {
    return " " + maxCount + " of " + matches.length + " " + itemLabel + " " + (maxCount === 1 ? "is" : "are") + " in paragraph " + (maxIdx + 1) + ".";
  }
  return "";
}

function sentenceCoveragePhrase(matches, sentences, itemLabel) {
  if (sentences.length === 0) return "";
  var sentSet = {};
  matches.forEach(function (m) {
    var idx = findSentenceIndex(sentences, m.start);
    if (idx >= 0) sentSet[idx] = true;
  });
  var n = Object.keys(sentSet).length;
  if (n === 0) return "";
  return n + " of your " + sentences.length + " sentence" + (sentences.length === 1 ? "" : "s") + " contain" + (n === 1 ? "s" : "") + " " + itemLabel + ".";
}

function densityScore(matchCount, denominator, target, penaltyPerPercent) {
  var density = denominator ? (matchCount / denominator) * 100 : 0;
  var score = clamp(100 - Math.max(0, density - target) * penaltyPerPercent, 0, 100);
  return { density: density, score: score };
}

// ---------- Self-reference: sentence-subject classification (change 4) ----------

function classifySentenceSubject(sentenceText, config) {
  var windowText = sentenceText.trim().split(/\s+/).slice(0, 8).join(" ");
  var candidates = [];
  function scan(list, label) {
    list.forEach(function (term) {
      var re = new RegExp("\\b" + escapeRegExp(term) + "\\b", "i");
      var m = re.exec(windowText);
      if (m) candidates.push({ pos: m.index, label: label });
    });
  }
  scan(config.companyFacingTerms, "company");
  scan(config.audienceFacingTerms, "audience");
  scan(config.thirdPartyTerms, "thirdParty");
  if (!candidates.length) return null;
  candidates.sort(function (a, b) { return a.pos - b.pos; });
  return candidates[0].label;
}
