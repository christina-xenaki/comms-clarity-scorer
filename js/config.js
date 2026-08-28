"use strict";

var SECTOR_FILES = {
  general: "config/config.json",
  healthcare: "config/config.healthcare.json",
  greenwashing: "config/config.greenwashing.json",
  ai: "config/config.ai.json",
  "forward-looking": "config/config.forward-looking.json"
};

function loadConfig(fileOrSector, isInitialLoad) {
  var file = SECTOR_FILES[fileOrSector] || fileOrSector;
  return fetch(file)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (json) {
      CONFIG = json;
      if (isInitialLoad && CONFIG.defaultEnglishVariant) elVariantSelect.value = CONFIG.defaultEnglishVariant;
      elConfigStatus.textContent = "Word lists loaded: " + (CONFIG.sectorName || file) + " (" + CONFIG.buzzwords.length + " buzzwords, " + CONFIG.hedges.length + " hedges)." +
        (CONFIG.regulatedClaims && CONFIG.regulatedClaims.enabled ? " Regulated-claim flags: on (tracked separately, not counted toward the overall grade)." : "");
      elConfigStatus.classList.remove("warn");
      if (!isInitialLoad && elInputText.value.trim()) analyze();
    })
    .catch(function (err) {
      elConfigStatus.textContent = "Couldn't load " + file + " (" + err.message + "). This tool needs its config file to run — serve the folder with a local web server rather than opening the file directly.";
      elConfigStatus.classList.add("warn");
    });
}

var urlParams = new URLSearchParams(location.search);
var sectorParam = urlParams.get("config");
var initialFile = "config/config.json";
var initialSelectValue = "general";
if (sectorParam) {
  if (SECTOR_FILES.hasOwnProperty(sectorParam)) {
    initialSelectValue = sectorParam;
    initialFile = SECTOR_FILES[sectorParam];
  } else {
    // Not one of the five fixed sectors, but still a valid advanced/custom config file to try.
    initialFile = "config/config." + sectorParam.replace(/[^a-z0-9-]/gi, "") + ".json";
  }
}
elSectorSelect.value = initialSelectValue;
loadConfig(initialFile, true);

elSectorSelect.addEventListener("change", function () {
  loadConfig(elSectorSelect.value, false);
});
