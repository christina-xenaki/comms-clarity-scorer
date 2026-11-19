"use strict";

// ---- Input and Results states (UI-SPEC §2) ----
// analyze() is never edited: these handlers run around it.

// "Paste some text first." is the same words analyze() alerts with; shown
// inline instead, because the check runs here before analyze() is called.
var EMPTY_TEXT_MESSAGE = "Paste some text first.";

function updateWordCount() {
  var n = elInputText.value.trim() ? tokenizeWords(elInputText.value).length : 0;
  elWordCount.textContent = n + " words";
}

// Called whenever a fresh result has been drawn, including re-runs after a
// Sector or English variant change.
function onResultsUpdated() {
  elRewriteCount.textContent = String(elRewriteList.querySelectorAll(".fix-card:not(.fix-empty)").length);
  applyChipStates(); // a re-run draws fresh highlights; keep the reader's chip choices
  if (!elShareOptions.hidden) refreshSharePanel();
  updatePrintHeading();
}

// ---- Highlight chips (UI-SPEC §4) ----
// A switched-off family loses its underlines and leaves the tab order; its
// screen-reader explanations stay in place.
function applyChipStates() {
  elChips.forEach(function (chip) {
    var family = chip.getAttribute("data-family");
    var on = chip.getAttribute("aria-pressed") === "true";
    elAnnotated.classList.toggle("hide-" + family, !on);
    HIGHLIGHT_FAMILIES[family].forEach(function (cls) {
      elAnnotated.querySelectorAll("mark." + cls).forEach(function (mark) {
        mark.setAttribute("tabindex", on ? "0" : "-1");
        if (!on) mark.classList.remove("open");
      });
    });
  });
}
elChips.forEach(function (chip) {
  chip.addEventListener("click", function () {
    chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
    applyChipStates();
  });
});

function showEmptyMessage() {
  // Clear first so a repeated message is announced again.
  elEmptyMessage.textContent = "";
  setTimeout(function () { elEmptyMessage.textContent = EMPTY_TEXT_MESSAGE; }, 50);
  elInputText.focus();
}

function runAnalysis() {
  if (!elInputText.value.trim()) { showEmptyMessage(); return; }
  elEmptyMessage.textContent = "";
  var previous = lastResult;
  analyze();
  if (lastResult === previous) return; // analyze() stopped early (word lists still loading)
  onResultsUpdated();
  setPageState("results");
  elForecast.focus();
}

function backToInput(clearText) {
  if (clearText) {
    elInputText.value = "";
    updateWordCount();
  }
  elEmptyMessage.textContent = "";
  closeExportMenu(false);
  closeSharePanel(false);
  setPageState("input");
  elInputText.focus();
}

elAnalyzeBtn.addEventListener("click", runAnalysis);
elEditTextBtn.addEventListener("click", function () { backToInput(false); });
elScoreNewBtn.addEventListener("click", function () { backToInput(true); });
elInputText.addEventListener("input", function () {
  updateWordCount();
  if (elInputText.value.trim()) elEmptyMessage.textContent = "";
});
updateWordCount();

// Changing the English variant re-runs the analysis while results are showing,
// the same as changing Sector (see config.js).
elVariantSelect.addEventListener("change", function () {
  if (document.body.getAttribute("data-state") !== "results" || !elInputText.value.trim()) return;
  analyze();
  onResultsUpdated();
});

document.addEventListener("click", function (e) {
  var hl = e.target.closest(".hl");
  document.querySelectorAll(".hl.open").forEach(function (el) { if (el !== hl) el.classList.remove("open"); });
  if (hl) { hl.classList.toggle("open"); e.stopPropagation(); }

  var whyBtn = e.target.closest(".why-toggle");
  if (whyBtn) {
    var expanded = whyBtn.getAttribute("aria-expanded") === "true";
    whyBtn.setAttribute("aria-expanded", String(!expanded));
    var panel = document.getElementById(whyBtn.getAttribute("aria-controls"));
    if (panel) panel.hidden = expanded;
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
  var hl = e.target.closest(".hl");
  if (!hl) return;
  e.preventDefault();
  document.querySelectorAll(".hl.open").forEach(function (el) { if (el !== hl) el.classList.remove("open"); });
  hl.classList.toggle("open");
});

// ---- Clipboard ----
// Each copy calls onDone once the text is on the clipboard (or the fallback
// has run). What gets copied is built in export.js and render.js, unchanged.

function copyPlainText(text, onDone) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onDone, function () { fallbackCopy(text, onDone); });
  } else {
    fallbackCopy(text, onDone);
  }
}

function copyRichText(html, text, onDone) {
  if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
    var item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([text], { type: "text/plain" })
    });
    navigator.clipboard.write([item]).then(onDone, function () { copyPlainText(text, onDone); });
  } else {
    copyPlainText(text, onDone);
  }
}

function fallbackCopy(text, onDone) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.className = "clipboard-fallback";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  onDone();
}

function announceCopy(message) {
  elCopyAnnouncer.textContent = "";
  setTimeout(function () { elCopyAnnouncer.textContent = message; }, 50);
}

// ---- Export menu (UI-SPEC §5) ----
var exportResetTimer = null;

function exportMenuItems() {
  return Array.prototype.slice.call(elExportMenu.querySelectorAll('[role="menuitem"]'));
}

function openExportMenu(focusLast) {
  elExportMenu.classList.remove("align-left");
  elExportMenu.hidden = false;
  if (elExportMenu.getBoundingClientRect().left < 0) elExportMenu.classList.add("align-left");
  elExportBtn.setAttribute("aria-expanded", "true");
  var items = exportMenuItems();
  items[focusLast ? items.length - 1 : 0].focus();
}

function closeExportMenu(returnFocus) {
  if (elExportMenu.hidden) return;
  elExportMenu.hidden = true;
  elExportBtn.setAttribute("aria-expanded", "false");
  if (returnFocus) elExportBtn.focus();
}

// On screen, the Export button shows the confirmation with a check icon for
// two seconds; screen readers hear the same words.
function confirmExport(message) {
  closeExportMenu(true);
  elExportBtnLabel.textContent = message;
  elExportBtnIcon.setAttribute("href", "#icon-check");
  elExportBtn.classList.add("is-confirmed");
  announceCopy(message);
  clearTimeout(exportResetTimer);
  exportResetTimer = setTimeout(function () {
    elExportBtnLabel.textContent = "Export";
    elExportBtnIcon.setAttribute("href", "#icon-download");
    elExportBtn.classList.remove("is-confirmed");
  }, 2000);
}

elExportBtn.addEventListener("click", function () {
  if (elExportMenu.hidden) openExportMenu(false); else closeExportMenu(true);
});
elExportBtn.addEventListener("keydown", function (e) {
  if (e.key === "ArrowDown") { e.preventDefault(); openExportMenu(false); }
  if (e.key === "ArrowUp") { e.preventDefault(); openExportMenu(true); }
});
elExportMenu.addEventListener("keydown", function (e) {
  var items = exportMenuItems();
  var i = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  else if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
  else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
  else if (e.key === "Escape") { e.preventDefault(); closeExportMenu(true); }
  else if (e.key === "Tab") { closeExportMenu(false); }
});
document.addEventListener("click", function (e) {
  if (!elExportMenu.hidden && !e.target.closest(".export-wrap")) closeExportMenu(false);
});

elExportEmailBtn.addEventListener("click", function () {
  if (!lastResult) return;
  copyRichText(buildExportRichHtml(lastResult), buildExportPlainText(lastResult), function () { confirmExport("Copied for email"); });
});

elExportSlackBtn.addEventListener("click", function () {
  if (!lastResult) return;
  copyPlainText(buildExportPlainText(lastResult), function () { confirmExport("Copied for Slack"); });
});

elCopyBtn.addEventListener("click", function () {
  if (!lastReportText) return;
  copyPlainText(lastReportText, function () { confirmExport("Copied full report"); });
});

elPrintBtn.addEventListener("click", function () {
  closeExportMenu(true);
  updatePrintHeading();
  window.print();
});

// ---- Share panel (UI-SPEC §2, §5) ----
// The panel shows exactly what the share actions send: the grade, the two
// counts and the tool URL, never the analysed text.
function refreshSharePanel() {
  if (!lastResult) return;
  var text = buildShareText(lastResult);
  elSharePreview.textContent = text;
  elShareWhatsappLink.href = "https://wa.me/?text=" + encodeURIComponent(text);
}

function closeSharePanel(returnFocus) {
  if (elShareOptions.hidden) return;
  elShareOptions.hidden = true;
  elShareScoreBtn.setAttribute("aria-expanded", "false");
  if (returnFocus) elShareScoreBtn.focus();
}

elShareScoreBtn.addEventListener("click", function () {
  if (!lastResult) return;
  if (!elShareOptions.hidden) { closeSharePanel(true); return; }
  refreshSharePanel();
  elShareOptions.hidden = false;
  elShareScoreBtn.setAttribute("aria-expanded", "true");
  elShareOptions.focus();
});
elShareOptions.addEventListener("keydown", function (e) {
  if (e.key === "Escape") { e.preventDefault(); closeSharePanel(true); }
});

// "Copied! Paste into Slack." is this button's existing feedback (COPY.md).
elShareSlackBtn.addEventListener("click", function () {
  if (!lastResult) return;
  copyPlainText(buildShareText(lastResult), function () {
    var label = elShareSlackBtn.querySelector(".btn-label");
    label.textContent = "Copied! Paste into Slack.";
    announceCopy("Copied! Paste into Slack.");
    setTimeout(function () { label.textContent = "Share to Slack"; }, 2000);
  });
});

// ---- Print-only heading and footer (UI-SPEC §5) ----
function updatePrintHeading() {
  if (!lastResult) return;
  var firstLine = lastResult.text.split("\n").map(function (l) { return l.trim(); }).filter(Boolean)[0] || "";
  elPrintTitle.textContent = firstLine.length > 120 ? firstLine.slice(0, 120).trim() + "…" : firstLine;
  var date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  var sector = elSectorSelect.options[elSectorSelect.selectedIndex].text;
  var variant = elVariantSelect.options[elVariantSelect.selectedIndex].text;
  elPrintMeta.textContent = "Scored " + date + " · Sector: " + sector + " · English: " + variant + " · " + tokenizeWords(lastResult.text).length + " words";
  elPrintUrl.textContent = location.origin + location.pathname;
}
window.addEventListener("beforeprint", updatePrintHeading);
