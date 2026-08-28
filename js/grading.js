"use strict";

function letterGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

// Weather scale, verbatim from COPY.md — deliberately not faces, since this often
// runs over a colleague's or CEO's copy in an open-plan office.
var GRADE_INFO = {
  A: { icon: "☀️", label: "Clear", ariaLabel: "Grade A, Clear" },
  B: { icon: "🌤", label: "Mostly clear", ariaLabel: "Grade B, Mostly clear" },
  C: { icon: "⛅", label: "Hazy", ariaLabel: "Grade C, Hazy" },
  D: { icon: "🌫", label: "Foggy", ariaLabel: "Grade D, Foggy" },
  E: { icon: "🌧️", label: "Murky", ariaLabel: "Grade E, Murky" }
};

function gradeClass(score) {
  if (score >= 80) return "grade-good";
  if (score >= 60) return "grade-warn";
  return "grade-bad";
}

function interpretGrade(grade) {
  if (grade <= 6) return { label: "Very easy to read — clear to most readers, including younger teens.", action: "No action needed." };
  if (grade <= 8) return { label: "Plain and clear — about the level of a well-written newspaper article.", action: "No action needed." };
  if (grade <= 10) return { label: "A bit dense — high-school reading level. Fine for trade press, harder for a general audience.", action: "Consider shortening a few of the longer sentences." };
  if (grade <= 13) return { label: "Dense — some college-level phrasing.", action: "Shorten sentences and simplify word choices." };
  return { label: "Very dense — reads like an academic paper, not a press release.", action: "Simplify substantially — shorter sentences, plainer words." };
}

function verdictForScore(score) {
  if (score >= 90) return "Clean and clear. Ship it.";
  if (score >= 80) return "Solid, with a few things worth tightening.";
  if (score >= 70) return "Readable, but corporate mush is creeping in.";
  if (score >= 60) return "Needs work — several issues are dragging this down.";
  return "Heavy rewrite recommended before this goes out.";
}
