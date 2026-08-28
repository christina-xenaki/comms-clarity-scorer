"use strict";

function toolUrl() {
  return location.origin + location.pathname;
}

function topFixesForExport(r) {
  return rankWorstOffenders(r).map(function (item) {
    return { text: item.d.clippedText.trim(), rewrite: findRewriteForSentence(r, item.d.sentence) };
  });
}

function gradeAndIconLine(r) {
  var gradeLetter = letterGrade(r.overall);
  var gradeInfo = GRADE_INFO[gradeLetter];
  return gradeInfo.icon + " Grade " + gradeLetter + " — " + gradeInfo.label + " (" + r.overall + "/100)";
}

function headlineMetricLine(r) {
  return r.buzzMatches.length + " buzzword" + (r.buzzMatches.length === 1 ? "" : "s") + ". " +
    r.concreteMatches.length + " concrete fact" + (r.concreteMatches.length === 1 ? "" : "s") + ".";
}

// Plain text, used directly for the "Copy for Slack" button and as the text/plain
// fallback for "Copy for email" when the browser can't write rich clipboard content.
function buildExportPlainText(r) {
  var lines = [];
  lines.push(gradeAndIconLine(r));
  lines.push(headlineMetricLine(r));
  lines.push("");
  lines.push("Top five fixes:");
  var fixes = topFixesForExport(r);
  if (fixes.length === 0) {
    lines.push("None — nice and tight.");
  } else {
    fixes.forEach(function (fix, i) {
      lines.push((i + 1) + ". " + fix.text);
      if (fix.rewrite && fix.rewrite.kind === "rewrite") {
        lines.push("   Suggested rewrite: " + fix.rewrite.original + " -> " + fix.rewrite.rewrite);
      } else if (fix.rewrite && fix.rewrite.kind === "question") {
        lines.push("   Worth asking yourself: " + fix.rewrite.question);
      }
    });
  }
  lines.push("");
  lines.push("Scored with Comms Clarity Scorer — " + toolUrl());
  lines.push("Runs in your browser. Nothing is uploaded.");
  return lines.join("\n");
}

// Rich text (HTML), used for the "Copy for email" button.
function buildExportRichHtml(r) {
  var html = "<p><strong>" + gradeAndIconLine(r) + "</strong></p>";
  html += "<p>" + headlineMetricLine(r) + "</p>";
  html += "<p><strong>Top five fixes</strong></p>";
  var fixes = topFixesForExport(r);
  if (fixes.length === 0) {
    html += "<p>None — nice and tight.</p>";
  } else {
    html += "<ol>";
    fixes.forEach(function (fix) {
      html += "<li>" + escapeHtml(fix.text);
      if (fix.rewrite && fix.rewrite.kind === "rewrite") {
        html += "<br><em>Suggested rewrite:</em> " + escapeHtml(fix.rewrite.original) + " → " + escapeHtml(fix.rewrite.rewrite);
      } else if (fix.rewrite && fix.rewrite.kind === "question") {
        html += "<br><em>Worth asking yourself:</em> " + escapeHtml(fix.rewrite.question);
      }
      html += "</li>";
    });
    html += "</ol>";
  }
  var url = toolUrl();
  html += "<p>Scored with Comms Clarity Scorer — <a href=\"" + url + "\">" + url + "</a><br>Runs in your browser. Nothing is uploaded.</p>";
  return html;
}

// Grade, headline metric, and tool URL only — never the analysed text or any
// flagged sentence, since a share link puts its contents in a URL.
function buildShareText(r) {
  var gradeLetter = letterGrade(r.overall);
  var gradeInfo = GRADE_INFO[gradeLetter];
  return "Clarity score: " + gradeLetter + " " + gradeInfo.label + ". " +
    r.buzzMatches.length + " buzzword" + (r.buzzMatches.length === 1 ? "" : "s") + ", " +
    r.concreteMatches.length + " concrete fact" + (r.concreteMatches.length === 1 ? "" : "s") + ".\n" +
    "Scored with " + toolUrl();
}
