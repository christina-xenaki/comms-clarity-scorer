"use strict";

var CONFIG = null;

function $(id) { return document.getElementById(id); }

var elInputText = $("input-text");
var elVariantSelect = $("variant-select");
var elSectorSelect = $("sector-select");
var elAnalyzeBtn = $("analyze-btn");
var elConfigStatus = $("config-status");
var elResultsPanel = $("results-panel");
var elAnnotatedSection = $("annotated-text-section");
var elHeadline = $("headline-metric");
var elOverallGrade = $("overall-grade");
var elOverallGradeIcon = $("overall-grade-icon");
var elOverallGradeText = $("overall-grade-text");
var elOverallVerdict = $("overall-verdict");
var elBoilerplateNote = $("boilerplate-note");
var elWorstList = $("worst-offenders-list");
var elRewriteList = $("rewrite-suggestions-list");
var elAnnotated = $("annotated-output");
var elCopyBtn = $("copy-report-btn");
var elExportEmailBtn = $("export-email-btn");
var elExportSlackBtn = $("export-slack-btn");
var elShareScoreBtn = $("share-score-btn");
var elShareOptions = $("share-score-options");
var elShareWhatsappLink = $("share-whatsapp-link");
var elShareSlackBtn = $("share-slack-btn");
var elAnnouncer = $("results-announcer");
var elViewLevelButtons = document.querySelectorAll(".segment[data-level]");
var elViewLevelDesc = $("view-level-desc");
var elInputSection = $("input-section");
var elWordCount = $("word-count");
var elEmptyMessage = $("empty-message");
var elEditTextBtn = $("edit-text-btn");
var elScoreNewBtn = $("score-new-btn");
var elForecast = $("forecast");
var elRewriteCount = $("rewrite-count");

var lastReportText = "";
var lastResult = null;

// Level descriptions, verbatim from COPY.md "View names".
var VIEW_LEVEL_DESCRIPTIONS = {
  glance: "Grade and headline only",
  working: "Scores and the top five fixes",
  full: "Everything, including sources"
};

function setViewLevel(level) {
  document.body.setAttribute("data-view", level);
  elViewLevelButtons.forEach(function (btn) {
    btn.setAttribute("aria-pressed", String(btn.getAttribute("data-level") === level));
  });
  elViewLevelDesc.textContent = VIEW_LEVEL_DESCRIPTIONS[level];
}
elViewLevelButtons.forEach(function (btn) {
  btn.addEventListener("click", function () { setViewLevel(btn.getAttribute("data-level")); });
});
setViewLevel(window.matchMedia("(max-width: 599px)").matches ? "glance" : "working");

// Input or Results (UI-SPEC §2). The page starts in Input.
function setPageState(state) {
  document.body.setAttribute("data-state", state);
}
setPageState("input");
