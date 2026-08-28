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
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(lastReportText).then(function () {
      elCopyBtn.textContent = "Copied!";
      setTimeout(function () { elCopyBtn.textContent = "Copy report"; }, 1500);
    }, function () { fallbackCopy(lastReportText); });
  } else {
    fallbackCopy(lastReportText);
  }
});

function fallbackCopy(text) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  elCopyBtn.textContent = "Copied!";
  setTimeout(function () { elCopyBtn.textContent = "Copy report"; }, 1500);
}
