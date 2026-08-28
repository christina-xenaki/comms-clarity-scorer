"use strict";

function dedupeOverlaps(matches) {
  matches.sort(function (a, b) { return a.start - b.start || (b.end - b.start) - (a.end - a.start); });
  var out = [];
  var lastEnd = -1;
  matches.forEach(function (m) {
    if (m.start >= lastEnd) { out.push(m); lastEnd = m.end; }
  });
  return out;
}

function firstUseOnly(matches) {
  var seen = {};
  var out = [];
  matches.forEach(function (m) {
    if (!seen[m.label]) { seen[m.label] = true; out.push(m); }
  });
  return out;
}

function genericPhraseMatches(text, list) {
  var matches = [];
  list.forEach(function (phrase) {
    var re = new RegExp("\\b" + escapeRegExp(phrase) + "\\b", "gi");
    var m;
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, label: m[0] });
      if (m[0].length === 0) re.lastIndex++;
    }
  });
  return dedupeOverlaps(matches);
}

function excludeAfter(matches, cutoff) {
  return matches.filter(function (m) { return m.start < cutoff; });
}

function findPassiveMatches(text, irregularMap) {
  var re = /\b(is|are|was|were|be|been|being|am)\b(\s+\w+ly)?\s+(\w+)/gi;
  var matches = [];
  var m;
  while ((m = re.exec(text)) !== null) {
    var candidate = m[3].toLowerCase();
    if (/ed$/.test(candidate) || irregularMap[candidate]) {
      matches.push({ start: m.index, end: m.index + m[0].length, label: m[0].trim() });
    }
  }
  return dedupeOverlaps(matches);
}

function regularParticipleToBase(word) {
  var w = word.toLowerCase();
  if (!/ed$/.test(w)) return w;
  var stem = w.slice(0, -2);
  if (/([bcdfgklmnprtvz])\1$/.test(stem)) return stem.slice(0, -1);
  if (/(at|it|et|ct|nc|rc|uc|iv|olv|erv)$/.test(stem)) return stem + "e";
  return stem;
}

function participleToBase(word, irregularMap) {
  var lower = word.toLowerCase();
  return irregularMap[lower] || regularParticipleToBase(word);
}

function findPassiveWithAgent(passiveMatches, text, irregularMap) {
  var withAgent = [];
  var noAgent = [];
  passiveMatches.forEach(function (m) {
    var tail = text.slice(m.end, m.end + 60);
    var am = /^\s+by\s+([A-Za-z][\w' -]{1,40}?)(?=[,.;:\n]|$)/.exec(tail);
    if (am) {
      var fullEnd = m.end + am[0].length;
      var participleWord = m.label.split(/\s+/).pop();
      var base = participleToBase(participleWord, irregularMap);
      var agent = am[1].trim();
      withAgent.push({
        start: m.start, end: fullEnd,
        original: text.slice(m.start, fullEnd),
        rewrite: agent.charAt(0).toUpperCase() + agent.slice(1) + " " + base
      });
    } else {
      noAgent.push(m);
    }
  });
  return { withAgent: withAgent, noAgent: noAgent };
}

function findNominalisationMatches(text, suffixes) {
  var re = new RegExp("\\b(\\w+(?:" + suffixes.join("|") + "))\\s+of\\b", "gi");
  var matches = [];
  var m;
  while ((m = re.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, label: m[1] });
  }
  return dedupeOverlaps(matches);
}

function findNominalisationRewrites(text, suffixes, verbMap) {
  var re = new RegExp("\\b(?:the|a|an)?\\s*(\\w+(?:" + suffixes.join("|") + "))\\s+of\\s+([^,.;\\n]{1,60}?)(?=\\s+\\b(?:was|is|are|were|and|but|which|who)\\b|[,.;\\n]|$)", "gi");
  var results = [];
  var m;
  while ((m = re.exec(text)) !== null) {
    var verb = verbMap[m[1].toLowerCase()];
    if (verb) {
      results.push({
        start: m.index, end: m.index + m[0].length,
        original: m[0].trim(),
        rewrite: verb + "ing " + m[2].trim()
      });
    }
  }
  return dedupeOverlaps(results);
}

function findWordSwapRewrites(text, swaps) {
  var results = [];
  Object.keys(swaps).forEach(function (from) {
    var re = new RegExp("\\b" + escapeRegExp(from) + "\\b", "gi");
    var m;
    while ((m = re.exec(text)) !== null) {
      results.push({ start: m.index, end: m.index + m[0].length, original: m[0], rewrite: swaps[from] });
    }
  });
  return dedupeOverlaps(results);
}

function findAcronymMatches(text, allowlist) {
  var allowSet = {};
  allowlist.forEach(function (a) { allowSet[a] = true; });
  var re = /\b[A-Z]{2,6}\b/g;
  var matches = [];
  var m;
  while ((m = re.exec(text)) !== null) {
    if (!allowSet[m[0]]) matches.push({ start: m.index, end: m.index + m[0].length, label: m[0] });
  }
  return dedupeOverlaps(matches);
}

function acronymExpansionInfo(text, matches) {
  var counts = {};
  matches.forEach(function (m) { counts[m.label] = (counts[m.label] || 0) + 1; });
  var neverExpanded = [];
  Object.keys(counts).forEach(function (acr) {
    var p1 = new RegExp("\\(\\s*" + acr + "\\s*\\)").test(text);
    var p2 = new RegExp(acr + "\\s*\\([^)]{3,80}\\)").test(text);
    if (!p1 && !p2) neverExpanded.push(acr);
  });
  return { uniqueCount: Object.keys(counts).length, neverExpanded: neverExpanded };
}

// Numbers, percentages, currency amounts — general concreteness signals (not dates).
function findNumericSignals(text) {
  var patterns = [
    /[$£€]\s?\d[\d,]*(\.\d+)?\s?(million|billion|thousand|k|m|bn)?/gi,
    /\b\d+(\.\d+)?\s?%/g,
    /\b\d[\d,]*(\.\d+)?\b/g
  ];
  var matches = [];
  patterns.forEach(function (re) {
    var m;
    while ((m = re.exec(text)) !== null) matches.push({ start: m.index, end: m.index + m[0].length, label: m[0] });
  });
  return matches;
}

// Dates and ordinal day references — the "specific timeframe" half of concreteness.
function findSpecificDates(text, monthNames) {
  var patterns = [
    /\b\d{1,2}(st|nd|rd|th)\b/gi,
    new RegExp("\\b(" + monthNames.join("|") + ")\\.?\\s+\\d{1,2}(st|nd|rd|th)?(,?\\s+\\d{4})?\\b", "gi"),
    new RegExp("\\b\\d{1,2}\\s+(" + monthNames.join("|") + ")\\.?(,?\\s+\\d{4})?\\b", "gi"),
    /\b(19|20)\d{2}\b/g
  ];
  var matches = [];
  patterns.forEach(function (re) {
    var m;
    while ((m = re.exec(text)) !== null) matches.push({ start: m.index, end: m.index + m[0].length, label: m[0] });
  });
  return matches;
}

function findConcreteSignals(text, monthNames) {
  return dedupeOverlaps(findNumericSignals(text).concat(findSpecificDates(text, monthNames)));
}

function findQuotes(text) {
  var re = /"([^"\n]{3,600})"|“([^”\n]{3,600})”/g;
  var quotes = [];
  var m;
  while ((m = re.exec(text)) !== null) {
    var inner = m[1] !== undefined ? m[1] : m[2];
    quotes.push({ start: m.index, end: m.index + m[0].length, text: inner });
  }
  return quotes;
}

function isInsideAnyQuote(pos, quotes) {
  return quotes.some(function (q) { return pos >= q.start && pos < q.end; });
}
