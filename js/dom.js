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
var elViewLevelRadios = document.querySelectorAll('input[name="view-level"]');

var lastReportText = "";
var lastResult = null;

function setViewLevel(level) {
  document.body.setAttribute("data-view", level);
  elViewLevelRadios.forEach(function (radio) { radio.checked = (radio.value === level); });
}
elViewLevelRadios.forEach(function (radio) {
  radio.addEventListener("change", function () { if (radio.checked) setViewLevel(radio.value); });
});
setViewLevel(window.matchMedia("(max-width: 599px)").matches ? "glance" : "working");
