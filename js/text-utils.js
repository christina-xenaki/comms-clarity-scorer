"use strict";

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function srcLink(href, label, text) {
  return "<a href=\"" + href + "\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"" + escapeHtml(label) + " (opens in a new tab)\">" + escapeHtml(text) + "</a>";
}

function segBody(parts) {
  var html = "";
  if (parts.finding) html += "<div class=\"seg-finding\"><span class=\"seg-label\">Finding</span> " + parts.finding + "</div>";
  if (parts.action) html += "<div class=\"seg-action\"><span class=\"seg-label\">Action</span> " + parts.action + "</div>";
  if (parts.rationale) {
    var panelId = "why-panel-" + parts.key;
    html += "<div class=\"why-wrap\">" +
      "<button type=\"button\" class=\"why-toggle\" aria-expanded=\"false\" aria-controls=\"" + panelId + "\">" +
      "<span>Why this check exists</span>" +
      "<svg class=\"why-chevron\" width=\"10\" height=\"10\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M6 4l4 4-4 4\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>" +
      "</button>" +
      "<div id=\"" + panelId + "\" class=\"why-panel\" hidden>" + parts.rationale + "</div>" +
      "</div>";
  }
  return html;
}

function tokenizeWords(str) {
  var m = str.match(/[A-Za-z0-9']+(?:-[A-Za-z0-9']+)*/g);
  return m || [];
}

function splitSentences(text) {
  var sentences = [];
  var re = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    var raw = m[0];
    if (raw.trim().length === 0) continue;
    sentences.push({ text: raw, start: m.index, end: m.index + raw.length });
  }
  return sentences;
}

function splitParagraphs(text) {
  var paras = [];
  var re = /\n[ \t]*\n+/g;
  var m;
  var breaks = [];
  while ((m = re.exec(text)) !== null) breaks.push({ start: m.index, end: m.index + m[0].length });
  var cursor = 0;
  breaks.forEach(function (b) {
    paras.push({ start: cursor, end: b.start });
    cursor = b.end;
  });
  paras.push({ start: cursor, end: text.length });
  return paras.map(function (p) { return { start: p.start, end: p.end, text: text.slice(p.start, p.end) }; })
    .filter(function (p) { return p.text.trim().length > 0; });
}

function findSentenceIndex(sentences, pos) {
  for (var i = 0; i < sentences.length; i++) {
    if (pos >= sentences[i].start && pos < sentences[i].end) return i;
  }
  return -1;
}

function findParagraphIndex(paragraphs, pos) {
  for (var i = 0; i < paragraphs.length; i++) {
    if (pos >= paragraphs[i].start && pos < paragraphs[i].end) return i;
  }
  return -1;
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  var matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
