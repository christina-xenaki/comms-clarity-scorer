"use strict";

elAnalyzeBtn.addEventListener("click", analyze);

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

elCopyBtn.addEventListener("click", function () {
  if (!lastReportText) return;
  copyPlainText(lastReportText, elCopyBtn, "Copy report");
});

function flashButtonLabel(btn, idleLabel, tempLabel) {
  btn.textContent = tempLabel;
  setTimeout(function () { btn.textContent = idleLabel; }, 1500);
}

function copyPlainText(text, btn, idleLabel, tempLabel) {
  tempLabel = tempLabel || "Copied!";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      flashButtonLabel(btn, idleLabel, tempLabel);
    }, function () { fallbackCopy(text, btn, idleLabel, tempLabel); });
  } else {
    fallbackCopy(text, btn, idleLabel, tempLabel);
  }
}

function copyRichText(html, text, btn, idleLabel) {
  if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
    var item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([text], { type: "text/plain" })
    });
    navigator.clipboard.write([item]).then(function () {
      flashButtonLabel(btn, idleLabel, "Copied!");
    }, function () { copyPlainText(text, btn, idleLabel); });
  } else {
    copyPlainText(text, btn, idleLabel);
  }
}

function fallbackCopy(text, btn, idleLabel, tempLabel) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  flashButtonLabel(btn, idleLabel, tempLabel || "Copied!");
}

elExportEmailBtn.addEventListener("click", function () {
  if (!lastResult) return;
  copyRichText(buildExportRichHtml(lastResult), buildExportPlainText(lastResult), elExportEmailBtn, "Copy for email");
});

elExportSlackBtn.addEventListener("click", function () {
  if (!lastResult) return;
  copyPlainText(buildExportPlainText(lastResult), elExportSlackBtn, "Copy for Slack");
});

elShareScoreBtn.addEventListener("click", function () {
  if (!lastResult) return;
  var expanded = elShareScoreBtn.getAttribute("aria-expanded") === "true";
  elShareScoreBtn.setAttribute("aria-expanded", String(!expanded));
  elShareOptions.hidden = expanded;
  elShareWhatsappLink.href = "https://wa.me/?text=" + encodeURIComponent(buildShareText(lastResult));
});

elShareSlackBtn.addEventListener("click", function () {
  if (!lastResult) return;
  copyPlainText(buildShareText(lastResult), elShareSlackBtn, "Share to Slack", "Copied! Paste into Slack.");
});
