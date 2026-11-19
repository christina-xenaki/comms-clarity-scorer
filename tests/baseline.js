#!/usr/bin/env node
"use strict";

// Scoring baseline for Comms Clarity Scorer.
//
// Runs the browser scoring code in Node, against the fictional releases in
// tests/fixtures/, and compares the results with tests/baseline.json. It is a
// developer tool only: the page never loads it.
//
//   node tests/baseline.js            compare with tests/baseline.json (exit 1 on any difference)
//   node tests/baseline.js --update   rewrite tests/baseline.json from the current code
//
// What it records for each case: grade, overall score, headline metric, every
// per-check score, every finding (the full analysis result), the top five fixes
// with their matched rewrites, and the exact text of each copy, export and share
// output. An interface-only change must leave all of it untouched.
//
// How it runs without a browser: the scripts share one global scope in the page,
// so they are loaded into a single Node "vm" context in the page's own order.
// analyze() reads two form fields and hands its result to renderResults(); those
// are replaced with stand-ins here. Nothing in js/ is changed or copied.

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = path.join(__dirname, "..");
var BASELINE_FILE = path.join(__dirname, "baseline.json");
var FIXED_TOOL_URL = { origin: "https://example.invalid", pathname: "/" };

// The six scoring files, then the two files holding the ranking, rewrite and
// export builders. Only function declarations run at the top level of each.
var SCRIPTS = [
  "text-utils.js", "grading.js", "matchers.js", "structure.js", "consistency.js", "analyze.js",
  "render.js", "export.js"
];

// Each fixture is scored as the page would score it with the given Sector and
// English variant selected. Every fixture is also scored under "general".
var CASES = [
  { fixture: "kettle-launch.txt", sector: "general", variant: "british-oxford" },
  { fixture: "clinic-trial.txt", sector: "general", variant: "british-oxford" },
  { fixture: "clinic-trial.txt", sector: "healthcare", variant: "british-oxford" },
  { fixture: "solar-partnership.txt", sector: "general", variant: "british" },
  { fixture: "solar-partnership.txt", sector: "greenwashing", variant: "american" }
];

// Same mapping as SECTOR_FILES in js/config.js (not loaded here, as it fetches
// over the network as soon as it runs).
var SECTOR_FILES = {
  general: "config/config.json",
  healthcare: "config/config.healthcare.json",
  greenwashing: "config/config.greenwashing.json",
  ai: "config/config.ai.json",
  "forward-looking": "config/config.forward-looking.json"
};

function readRepoFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function scoreCase(c) {
  var text = readRepoFile(path.join("tests", "fixtures", c.fixture));
  var captured = null;
  var ctx = {
    console: console,
    alert: function (msg) { throw new Error("analyze() refused to run: " + msg); },
    location: FIXED_TOOL_URL,
    CONFIG: JSON.parse(readRepoFile(SECTOR_FILES[c.sector])),
    elInputText: { value: text },
    elVariantSelect: { value: c.variant },
    elResultsPanel: {},
    elAnnotatedSection: {}
  };
  vm.createContext(ctx);
  SCRIPTS.forEach(function (file) {
    vm.runInContext(readRepoFile(path.join("js", file)), ctx, { filename: "js/" + file });
  });
  // Stand-in for the page renderer: keep the result instead of drawing it.
  ctx.renderResults = function (r) { captured = r; };
  vm.runInContext("analyze()", ctx);
  if (!captured) throw new Error("analyze() produced no result for " + c.fixture);

  var r = captured;
  var letter = ctx.letterGrade(r.overall);
  var findings = Object.assign({}, r);
  delete findings.text; // the fixture itself; already on disk

  return {
    fixture: c.fixture,
    sector: c.sector,
    variant: c.variant,
    grade: letter,
    gradeLabel: ctx.GRADE_INFO[letter].label,
    score: r.overall,
    headline: ctx.headlineMetricLine(r),
    checks: {
      concreteness: r.concretenessScore,
      strengths: r.strengthsScore,
      emptyQuote: r.emptyQuoteScore,
      buzzwordDensity: r.buzz.score,
      sentenceLength: r.lengthScore,
      readability: r.readScore,
      passiveVoice: r.passiveScore,
      hedging: r.hedge.score,
      superlatives: r.superlative.score,
      nominalisation: r.nominal.score,
      selfReference: r.selfRefScore,
      acronymLoad: r.acronymScore,
      invertedPyramid: r.pyramidScore,
      consistency: r.consistencyScore,
      englishVariant: r.variantScore,
      regulatedClaims: r.regulatedEnabled ? r.regulatedScore : null
    },
    topFixes: ctx.rankWorstOffenders(r).map(function (item) {
      return {
        sentence: item.d.clippedText,
        badness: item.badness,
        overBy: item.overBy,
        rewrite: ctx.findRewriteForSentence(r, item.d.sentence)
      };
    }),
    outputs: {
      copyReport: ctx.buildReportText(r),
      exportPlain: ctx.buildExportPlainText(r),
      exportRichHtml: ctx.buildExportRichHtml(r),
      share: ctx.buildShareText(r)
    },
    findings: findings
  };
}

// JSON round trip so the comparison sees exactly what is stored on disk.
function runAll() {
  return JSON.parse(JSON.stringify({
    note: "Generated by tests/baseline.js from the fictional texts in tests/fixtures. Do not edit by hand.",
    cases: CASES.map(scoreCase)
  }));
}

// Lists the paths where two JSON values differ (first 50).
function diff(a, b, at, out) {
  if (out.length >= 50) return out;
  if (a === b) return out;
  var ta = Array.isArray(a) ? "array" : typeof a;
  var tb = Array.isArray(b) ? "array" : typeof b;
  if (a === null || b === null || ta !== tb || ta !== "object" && ta !== "array") {
    out.push(at + ": expected " + JSON.stringify(a) + ", got " + JSON.stringify(b));
    return out;
  }
  var keys = {};
  Object.keys(a).concat(Object.keys(b)).forEach(function (k) { keys[k] = true; });
  Object.keys(keys).forEach(function (k) {
    diff(a[k], b[k], at + (ta === "array" ? "[" + k + "]" : "." + k), out);
  });
  return out;
}

function summaryLine(c) {
  return c.fixture + " (" + c.sector + ", " + c.variant + "): " + c.grade + " " + c.gradeLabel +
    ", " + c.score + "/100, " + c.headline + " " + c.topFixes.length + " top fixes";
}

var current = runAll();

if (process.argv.indexOf("--update") !== -1) {
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(current, null, 2) + "\n");
  current.cases.forEach(function (c) { console.log(summaryLine(c)); });
  console.log("Wrote " + path.relative(ROOT, BASELINE_FILE));
  process.exit(0);
}

if (!fs.existsSync(BASELINE_FILE)) {
  console.error("No tests/baseline.json yet. Run: node tests/baseline.js --update");
  process.exit(2);
}

var expected = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
var problems = diff(expected, current, "baseline", []);
current.cases.forEach(function (c) { console.log(summaryLine(c)); });
if (problems.length) {
  console.error("\nFAIL: output differs from tests/baseline.json");
  problems.forEach(function (p) { console.error("  " + p); });
  process.exit(1);
}
console.log("\nPASS: output matches tests/baseline.json (" + current.cases.length + " cases)");
