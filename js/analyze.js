"use strict";

// ---------- Main analysis ----------

function analyze() {
  var rawText = elInputText.value;
  if (!rawText || !rawText.trim()) {
    alert("Paste some text first.");
    return;
  }
  if (!CONFIG) { alert("Word lists haven't finished loading yet — try again in a moment."); return; }
  var T = CONFIG.thresholds;
  var variant = elVariantSelect.value;

  var stopSet = {};
  CONFIG.stopwords.forEach(function (w) { stopSet[w.toLowerCase()] = true; });

  var allSentences = splitSentences(rawText);
  var paragraphs = splitParagraphs(rawText);
  var zones = detectZones(rawText, paragraphs, allSentences, CONFIG);
  var boilerplate = zones.boilerplate;
  var scoringEnd = boilerplate ? boilerplate.start : rawText.length;

  var sentences = allSentences.filter(function (s) { return s.start < scoringEnd; });
  var scoringWords = tokenizeWords(rawText.slice(0, scoringEnd));
  var totalWords = scoringWords.length;
  var contentWords = scoringWords.filter(function (w) { return !stopSet[w.toLowerCase()]; }).length;

  function inScope(matches) { return excludeAfter(matches, scoringEnd); }

  // All matches computed against the FULL text (so highlight offsets are correct),
  // then filtered to the non-boilerplate scoring window for every score/count.
  var buzzMatchesAll = genericPhraseMatches(rawText, CONFIG.buzzwords);
  var hedgeMatchesAll = genericPhraseMatches(rawText, CONFIG.hedges);
  var superlativeMatchesAll = genericPhraseMatches(rawText, CONFIG.superlativesAndAbsolutes);
  var passiveMatchesAll = findPassiveMatches(rawText, CONFIG.irregularVerbs);
  var nominalMatchesAll = findNominalisationMatches(rawText, CONFIG.nominalisationSuffixes);
  var acronymMatchesAll = findAcronymMatches(rawText, CONFIG.acronymAllowlist);
  var concreteMatchesAll = findConcreteSignals(rawText, CONFIG.monthNames);
  var quotesAll = findQuotes(rawText);
  var baselineMatchesAll = genericPhraseMatches(rawText, CONFIG.baselineIndicators);
  var preciseVerbMatchesAll = genericPhraseMatches(rawText, CONFIG.preciseVerbs);
  var plainWordMatchesAll = genericPhraseMatches(rawText, Object.keys(CONFIG.wordSwaps).map(function (k) { return CONFIG.wordSwaps[k]; }));
  var regulatedMatchesAll = (CONFIG.regulatedClaims && CONFIG.regulatedClaims.enabled && CONFIG.regulatedClaims.terms.length)
    ? genericPhraseMatches(rawText, CONFIG.regulatedClaims.terms) : [];

  var buzzMatches = inScope(buzzMatchesAll);
  var hedgeMatches = inScope(hedgeMatchesAll);
  var superlativeMatches = inScope(superlativeMatchesAll);
  var passiveMatches = inScope(passiveMatchesAll);
  var nominalMatches = inScope(nominalMatchesAll);
  var acronymMatches = inScope(acronymMatchesAll);
  var acronymFirstUse = firstUseOnly(acronymMatches);
  var concreteMatches = inScope(concreteMatchesAll);
  var quotes = quotesAll.filter(function (q) { return q.start < scoringEnd; });
  var baselineMatches = inScope(baselineMatchesAll);
  var preciseVerbMatches = inScope(preciseVerbMatchesAll);
  var plainWordMatches = inScope(plainWordMatchesAll);
  var regulatedMatches = inScope(regulatedMatchesAll);

  // Per-sentence tallies (for sentence-length, worst-offenders, lede check).
  var sentenceData = sentences.map(function (s) {
    var clippedEnd = Math.min(s.end, scoringEnd);
    var clippedText = rawText.slice(s.start, clippedEnd);
    return { sentence: s, clippedText: clippedText, wordCount: tokenizeWords(clippedText).length, buzz: 0, hedge: 0, superlative: 0, nominal: 0, acronym: 0, passive: false, precise: 0 };
  });
  function tally(matches, key, flagOnly) {
    matches.forEach(function (m) {
      var idx = findSentenceIndex(sentences, m.start);
      if (idx >= 0) { if (flagOnly) sentenceData[idx][key] = true; else sentenceData[idx][key]++; }
    });
  }
  tally(buzzMatches, "buzz");
  tally(hedgeMatches, "hedge");
  tally(superlativeMatches, "superlative");
  tally(nominalMatches, "nominal");
  tally(passiveMatches, "passive", true);
  tally(preciseVerbMatches, "precise");

  var acronymInfo = acronymExpansionInfo(rawText, acronymMatches);
  var neverExpandedSet = {};
  acronymInfo.neverExpanded.forEach(function (a) { neverExpandedSet[a] = true; });
  tally(acronymFirstUse.filter(function (m) { return neverExpandedSet[m.label]; }), "acronym");

  // ---- sentence length, buzzwords (content-word denominator), readability ----
  var limit = T.sentenceLengthLimit;
  var overLimit = sentenceData.filter(function (d) { return d.wordCount > limit; });
  var avgLength = sentenceData.length ? sentenceData.reduce(function (s, d) { return s + d.wordCount; }, 0) / sentenceData.length : 0;
  var percentOver = sentenceData.length ? (overLimit.length / sentenceData.length) * 100 : 0;
  var lengthScore = clamp(100 - Math.max(0, avgLength - T.sentenceLengthComfortableAverage) * T.sentenceLengthPenaltyPerWordOverAverage - percentOver * T.sentenceLengthPenaltyPerPercentOverLimit, 0, 100);

  var buzz = densityScore(buzzMatches.length, contentWords, 0, T.buzzwordPenaltyPerPercent);
  var hedge = densityScore(hedgeMatches.length, contentWords, T.hedgeDensityTarget, T.hedgePenaltyPerPercent);
  var superlative = densityScore(superlativeMatches.length, contentWords, T.superlativeDensityTarget, T.superlativePenaltyPerPercent);
  var nominal = densityScore(nominalMatches.length, contentWords, T.nominalisationDensityTarget, T.nominalisationPenaltyPerPercent);

  var syllables = 0;
  scoringWords.forEach(function (w) { syllables += countSyllables(w); });
  var grade = (totalWords === 0 || sentences.length === 0) ? 0 : 0.39 * (totalWords / sentences.length) + 11.8 * (syllables / totalWords) - 15.59;
  var readScore = clamp(100 - Math.max(0, grade - T.targetReadabilityGrade) * T.readabilityPenaltyPerGrade, 0, 100);

  var passiveSentenceCount = sentenceData.filter(function (d) { return d.passive; }).length;
  var passivePercent = sentences.length ? (passiveSentenceCount / sentences.length) * 100 : 0;
  var passiveScore = clamp(100 - Math.max(0, passivePercent - T.passiveVoiceAcceptablePercent) * T.passiveVoicePenaltyPerPercent, 0, 100);

  var signalsPer100 = totalWords ? (concreteMatches.length / totalWords) * 100 : 0;
  var concretenessScore = concreteMatches.length === 0 ? 0 : clamp((signalsPer100 / T.concretenessTargetPer100Words) * 100, 0, 100);

  var acronymScore = clamp(100 - acronymInfo.neverExpanded.length * T.acronymNeverExpandedPenaltyEach, 0, 100);

  var quoteData = quotes.map(function (q) {
    var words = tokenizeWords(q.text).length;
    var qBuzz = genericPhraseMatches(q.text, CONFIG.buzzwords).length;
    var qConcrete = findConcreteSignals(q.text, CONFIG.monthNames).length;
    var qReason = genericPhraseMatches(q.text, CONFIG.reasonIndicators).length > 0;
    var qDecision = genericPhraseMatches(q.text, CONFIG.decisionIndicators).length > 0;
    var isEmpty = qConcrete === 0 && words >= T.emptyQuoteMinWords;
    var informative = qConcrete > 0 || qReason || qDecision;
    return { start: q.start, end: q.end, text: q.text, words: words, buzz: qBuzz, concrete: qConcrete, isEmpty: isEmpty, informative: informative };
  });
  var emptyQuotes = quoteData.filter(function (q) { return q.isEmpty; });
  var informativeQuotes = quoteData.filter(function (q) { return q.informative; });
  var emptyQuoteScore = quoteData.length === 0 ? 100 : clamp(100 * (1 - emptyQuotes.length / quoteData.length), 0, 100);

  // ---- strengths ----
  var activeVoiceSentences = sentenceData.filter(function (d) {
    return d.precise > 0 && !d.passive && /^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}/.test(d.clippedText.trim());
  });
  var strengthSignalCount = baselineMatches.length + activeVoiceSentences.length + preciseVerbMatches.length +
    informativeQuotes.length + plainWordMatches.length;
  var strengthsPer100 = contentWords ? (strengthSignalCount / contentWords) * 100 : 0;
  var strengthsScore = clamp((strengthsPer100 / T.strengthsTargetPer100ContentWords) * 100, 0, 100);

  // ---- rewrite suggestions ----
  var passiveSplit = findPassiveWithAgent(passiveMatches, rawText, CONFIG.irregularVerbs);
  var nominalRewrites = inScope(findNominalisationRewrites(rawText, CONFIG.nominalisationSuffixes, CONFIG.nominalisationVerbMap));
  var wordSwapRewrites = inScope(findWordSwapRewrites(rawText, CONFIG.wordSwaps));

  // ---- inverted pyramid ----
  var firstConcrete = concreteMatches.length ? concreteMatches[0] : null;
  var factDepthWords = firstConcrete ? tokenizeWords(rawText.slice(0, firstConcrete.start)).length : null;
  var lede = zones.lede;
  var ledeHasWho = lede ? (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/.test(lede.text) || /\b[A-Z][a-zA-Z]*\s+(Inc|Corp|Ltd|LLC|PLC|Co)\b/.test(lede.text)) : false;
  var ledeHasWhen = lede ? findSpecificDates(lede.text, CONFIG.monthNames).length > 0 : false;
  var quoteBeforeNews = quotes.length > 0 && firstConcrete !== null && quotes[0].start < firstConcrete.start;
  var nonBoilerplateParagraphs = paragraphs.filter(function (p) { return p.start < scoringEnd; });
  var firstParaDensity = 0, lastParaDensity = 0, densityDeclineOk = true;
  if (nonBoilerplateParagraphs.length >= 2) {
    var firstPara = nonBoilerplateParagraphs[0];
    var lastPara = nonBoilerplateParagraphs[nonBoilerplateParagraphs.length - 1];
    var firstParaWords = tokenizeWords(firstPara.text).length;
    var lastParaWords = tokenizeWords(lastPara.text).length;
    var firstParaConcrete = concreteMatches.filter(function (m) { return m.start >= firstPara.start && m.start < firstPara.end; }).length;
    var lastParaConcrete = concreteMatches.filter(function (m) { return m.start >= lastPara.start && m.start < lastPara.end; }).length;
    firstParaDensity = firstParaWords ? firstParaConcrete / firstParaWords * 100 : 0;
    lastParaDensity = lastParaWords ? lastParaConcrete / lastParaWords * 100 : 0;
    densityDeclineOk = lastParaDensity <= firstParaDensity;
  }
  var pyramidScore = 100;
  if (factDepthWords === null || factDepthWords > T.factDepthWarningWords) pyramidScore -= T.invertedPyramidFactDepthPenalty;
  if (!(ledeHasWho && ledeHasWhen)) pyramidScore -= T.invertedPyramidLedePenalty;
  if (quoteBeforeNews) pyramidScore -= T.invertedPyramidQuotePenalty;
  if (!densityDeclineOk) pyramidScore -= T.invertedPyramidDensityPenalty;
  pyramidScore = clamp(pyramidScore, 0, 100);

  // ---- consistency ----
  var consistencyIssues = runConsistencyChecks(rawText.slice(0, scoringEnd), scoringWords, CONFIG);
  var consistencyScore = clamp(100 - consistencyIssues.length * T.consistencyPenaltyPerIssueType, 0, 100);

  // ---- English variant ----
  var variantMismatches = computeVariantMismatches(rawText.slice(0, scoringEnd), variant, CONFIG);
  var variantScore = clamp(100 - variantMismatches.length * T.englishVariantPenaltyPerMismatch, 0, 100);

  // ---- regulated claims (reported, but never folded into the overall clarity score) ----
  var regulatedEnabled = CONFIG.regulatedClaims && CONFIG.regulatedClaims.enabled && CONFIG.regulatedClaims.terms.length > 0;
  var regulatedScore = regulatedEnabled ? clamp(100 - regulatedMatches.length * T.regulatedClaimPenaltyPerMatch, 0, 100) : 100;

  // ---- self-reference: sentence-subject classification, excluding quotes and boilerplate ----
  var selfRefCompany = 0, selfRefAudience = 0, selfRefThirdParty = 0, selfRefUnclassified = 0, selfRefExcludedQuotes = 0;
  sentenceData.forEach(function (d) {
    if (isInsideAnyQuote(d.sentence.start, quotes)) { selfRefExcludedQuotes++; return; }
    var cls = classifySentenceSubject(d.clippedText, CONFIG);
    if (cls === "company") selfRefCompany++;
    else if (cls === "audience") selfRefAudience++;
    else if (cls === "thirdParty") selfRefThirdParty++;
    else selfRefUnclassified++;
  });
  var selfRefClassified = selfRefCompany + selfRefAudience + selfRefThirdParty;
  var selfRefCompanySharePercent = selfRefClassified ? (selfRefCompany / selfRefClassified) * 100 : 0;
  var selfRefScore = selfRefClassified === 0 ? 100 : clamp(100 - Math.max(0, selfRefCompanySharePercent - T.selfReferenceCompanyShareTarget) * T.selfReferencePenaltyPerSharePoint, 0, 100);

  // ---- Boilerplate (graded separately, not part of the main score) ----
  var boilerplateInfo = null;
  if (boilerplate) {
    var bpText = rawText.slice(boilerplate.start, boilerplate.end);
    var bpWords = tokenizeWords(bpText).length;
    var bpBuzz = genericPhraseMatches(bpText, CONFIG.buzzwords).length;
    boilerplateInfo = { words: bpWords, buzz: bpBuzz };
  }

  // ---- Overall score (regulated claims is deliberately never included here) ----
  var scores = {
    buzzwordDensity: buzz.score, sentenceLength: lengthScore, readability: readScore,
    passiveVoice: passiveScore, emptyQuote: emptyQuoteScore, hedging: hedge.score,
    concreteness: concretenessScore, nominalisation: nominal.score,
    selfReference: selfRefScore, superlatives: superlative.score, acronymLoad: acronymScore,
    strengths: strengthsScore, invertedPyramid: pyramidScore, consistency: consistencyScore,
    englishVariant: variantScore
  };

  var weights = CONFIG.weights;
  var weightedSum = 0, totalWeight = 0;
  Object.keys(scores).forEach(function (key) {
    var w = typeof weights[key] === "number" ? weights[key] : 1;
    weightedSum += scores[key] * w;
    totalWeight += w;
  });
  var overall = Math.round(totalWeight > 0 ? weightedSum / totalWeight : 0);

  var result = {
    text: rawText, sentences: sentences, sentenceData: sentenceData, paragraphs: paragraphs, zones: zones,
    boilerplate: boilerplate, boilerplateInfo: boilerplateInfo, scoringEnd: scoringEnd,
    totalWords: totalWords, contentWords: contentWords, limit: limit,
    overLimit: overLimit, avgLength: avgLength,
    buzzMatches: buzzMatches, buzz: buzz,
    grade: grade, readScore: readScore,
    passiveMatches: passiveMatches, passivePercent: passivePercent, passiveSentenceCount: passiveSentenceCount, passiveScore: passiveScore,
    passiveSplit: passiveSplit,
    hedgeMatches: hedgeMatches, hedge: hedge,
    superlativeMatches: superlativeMatches, superlative: superlative,
    nominalMatches: nominalMatches, nominal: nominal, nominalRewrites: nominalRewrites,
    acronymMatches: acronymMatches, acronymFirstUse: acronymFirstUse, acronymInfo: acronymInfo, acronymScore: acronymScore,
    concreteMatches: concreteMatches, signalsPer100: signalsPer100, concretenessScore: concretenessScore,
    quoteData: quoteData, emptyQuotes: emptyQuotes, informativeQuotes: informativeQuotes, emptyQuoteScore: emptyQuoteScore,
    baselineMatches: baselineMatches, preciseVerbMatches: preciseVerbMatches, plainWordMatches: plainWordMatches,
    activeVoiceSentences: activeVoiceSentences, strengthSignalCount: strengthSignalCount, strengthsPer100: strengthsPer100, strengthsScore: strengthsScore,
    wordSwapRewrites: wordSwapRewrites,
    factDepthWords: factDepthWords, ledeHasWho: ledeHasWho, ledeHasWhen: ledeHasWhen,
    quoteBeforeNews: quoteBeforeNews, densityDeclineOk: densityDeclineOk,
    firstParaDensity: firstParaDensity, lastParaDensity: lastParaDensity, pyramidScore: pyramidScore,
    consistencyIssues: consistencyIssues, consistencyScore: consistencyScore,
    variant: variant, variantMismatches: variantMismatches, variantScore: variantScore,
    regulatedEnabled: regulatedEnabled, regulatedMatches: regulatedMatches, regulatedScore: regulatedScore,
    selfRefCompany: selfRefCompany, selfRefAudience: selfRefAudience, selfRefThirdParty: selfRefThirdParty,
    selfRefUnclassified: selfRefUnclassified, selfRefExcludedQuotes: selfRefExcludedQuotes,
    selfRefClassified: selfRefClassified, selfRefCompanySharePercent: selfRefCompanySharePercent, selfRefScore: selfRefScore,
    lengthScore: lengthScore, overall: overall
  };

  renderResults(result);
  elResultsPanel.hidden = false;
  elAnnotatedSection.hidden = false;
}
