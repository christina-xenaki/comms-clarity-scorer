"use strict";

// ---------- Consistency checks (section F) ----------

function findDoubledWords(text) {
  var re = /\b(\w+)\s+\1\b/gi;
  var out = [], m;
  while ((m = re.exec(text)) !== null) out.push(m[0]);
  return out;
}

function findMissingSpaceAfterPeriod(text) {
  var re = /[a-z0-9]\.[A-Z][a-z]/g;
  var count = 0, m;
  while ((m = re.exec(text)) !== null) count++;
  return count;
}

function findInconsistentCapitalisation(tokens) {
  var forms = {};
  tokens.forEach(function (w) {
    if (w.length < 3 || !/^[a-zA-Z]+$/.test(w)) return;
    var lower = w.toLowerCase();
    forms[lower] = forms[lower] || {};
    forms[lower][w] = true;
  });
  var flagged = [];
  Object.keys(forms).forEach(function (lower) {
    var variants = Object.keys(forms[lower]).filter(function (v) { return /[A-Z]/.test(v); });
    if (variants.length > 1) flagged.push(lower + " (" + variants.join(" / ") + ")");
  });
  return flagged;
}

function runConsistencyChecks(text, tokens, config) {
  var issues = [];

  var doubled = findDoubledWords(text);
  if (doubled.length) issues.push({ type: "Doubled words", detail: doubled.slice(0, 5).join(", ") + (doubled.length > 5 ? ", …" : "") });

  var doubleSpaceCount = (text.match(/[^\S\n]{2,}/g) || []).length;
  if (doubleSpaceCount) issues.push({ type: "Double spaces", detail: doubleSpaceCount + " instance(s)" });

  var missingSpace = findMissingSpaceAfterPeriod(text);
  if (missingSpace) issues.push({ type: "Missing space after full stop", detail: missingSpace + " instance(s)" });

  var straightCount = (text.match(/"/g) || []).length;
  if (straightCount % 2 !== 0) issues.push({ type: "Unclosed straight quotation marks", detail: "odd number of \" characters (" + straightCount + ")" });
  var curlyOpen = (text.match(/“/g) || []).length;
  var curlyClose = (text.match(/”/g) || []).length;
  if (curlyOpen !== curlyClose) issues.push({ type: "Unclosed curly quotation marks", detail: curlyOpen + " opening vs " + curlyClose + " closing" });

  var caps = findInconsistentCapitalisation(tokens);
  if (caps.length) issues.push({ type: "Inconsistent capitalisation", detail: caps.slice(0, 4).join("; ") + (caps.length > 4 ? "; …" : "") });

  var hasCommaGrouped = /\b\d{1,3}(,\d{3})+\b/.test(text);
  var hasPlainLarge = /\b\d{4,}\b/.test(text.replace(/\b\d{1,3}(,\d{3})+\b/g, ""));
  if (hasCommaGrouped && hasPlainLarge) issues.push({ type: "Mixed number formats", detail: "both 1,000-style and 1000-style numbers appear" });

  var hasMonthName = new RegExp("\\b(" + config.monthNames.join("|") + ")\\b", "i").test(text);
  var hasNumericDate = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(text);
  var hasIsoDate = /\b\d{4}-\d{2}-\d{2}\b/.test(text);
  if ([hasMonthName, hasNumericDate, hasIsoDate].filter(Boolean).length >= 2) issues.push({ type: "Mixed date formats", detail: "more than one date style appears" });

  var hasStraightQuote = /"/.test(text);
  var hasCurlyQuote = /[“”]/.test(text);
  if (hasStraightQuote && hasCurlyQuote) issues.push({ type: "Mixed straight and curly quotes", detail: "both \" and “ ” appear" });
  var hasCurlyApos = /’/.test(text);
  if (/'/.test(text) && hasCurlyApos) issues.push({ type: "Mixed straight and curly apostrophes", detail: "both ' and ’ appear" });

  return issues;
}

// ---------- English variant checks (section G) ----------

function computeVariantMismatches(text, variant, config) {
  var mismatches = [];
  var alwaysIse = {};
  config.alwaysIseWords.forEach(function (w) { alwaysIse[w.toLowerCase()] = true; });

  Object.keys(config.variantWordPairs).forEach(function (category) {
    config.variantWordPairs[category].forEach(function (pair) {
      var british = pair[0], american = pair[1];
      var correct;
      if (category === "-ise/-ize") {
        correct = (variant === "american" || variant === "british-oxford") ? american : british;
        if (variant === "british-oxford" && alwaysIse[british.toLowerCase()]) return;
      } else {
        correct = (variant === "american") ? american : british;
      }
      var wrong = (correct === british) ? american : british;
      var re = new RegExp("\\b" + escapeRegExp(wrong) + "\\w*\\b", "gi");
      var m;
      while ((m = re.exec(text)) !== null) {
        mismatches.push({ label: m[0], suggestion: correct + "…" });
      }
    });
  });

  var wantPeriod = variant === "american";
  config.titleAbbreviations.forEach(function (title) {
    var re = wantPeriod
      ? new RegExp("\\b" + title + "\\b(?!\\.)", "g")
      : new RegExp("\\b" + title + "\\.", "g");
    var m;
    while ((m = re.exec(text)) !== null) {
      mismatches.push({ label: m[0], suggestion: wantPeriod ? title + "." : title });
    }
  });

  var ambiguousDates = (text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) || []);
  ambiguousDates.forEach(function (d) { mismatches.push({ label: d, suggestion: "spell out the month — this format is ambiguous" }); });

  var wantInside = variant === "american";
  var insideCount = (text.match(/[.,]["”]/g) || []).length;
  var outsideCount = (text.match(/["”][.,]/g) || []).length;
  if (wantInside && outsideCount > 0) {
    mismatches.push({ label: outsideCount + " quote(s) with punctuation outside", suggestion: "American style: put periods/commas inside the closing quote" });
  } else if (!wantInside && insideCount > 0) {
    mismatches.push({ label: insideCount + " quote(s) with punctuation inside", suggestion: "British style: put periods/commas outside the closing quote unless they're part of what's quoted" });
  }

  return mismatches;
}
