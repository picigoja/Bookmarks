import { $id, on } from "../../shared/dom.js";
import { parseCsvWithWorker } from "./data/parseCsv.js";
import { enrich } from "./data/enrich.js";
import { ChartsRenderer } from "./render/charts.js";
import { DashboardRenderer } from "./render/dashboard.js";
import { initEfficiencyTheme } from "./theme.js";

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("../sw.js").catch(() => {});
  }
}

function main() {
  initEfficiencyTheme();

  const dom = {
    uploadContainer: $id("upload-container"),
    dashboardContainer: $id("dashboard-container"),
    dropZone: $id("drop-zone"),
    fileInput: $id("file-input"),
    errorMessage: $id("error-message"),
    btnReset: $id("btn-reset"),
    loadingOverlay: $id("loading-overlay"),
    loadingProgress: $id("loading-progress"),
    selectWindow: $id("select-window"),
    inputMinSampleN: $id("input-min-sample-n"),
    inputTopN: $id("input-top-n"),
    chkExcludeRoleOverlap: $id("chk-exclude-role-overlap"),
    chkExcludeNegDurations: $id("chk-exclude-neg-durations"),
    kpiTotalEvents: $id("kpi-total-events"),
    kpiDataEnd: $id("kpi-data-end"),
    kpiMedianCycle: $id("kpi-median-cycle"),
    kpiRepeatRate: $id("kpi-repeat-rate"),
    kpiSameErrorRepeatRate: $id("kpi-same-error-repeat-rate"),
    kpiFpy: $id("kpi-fpy"),
    dataQuality: $id("data-quality"),
    chartDebugSpeed: $id("chart-debug-speed"),
    chartRepairSpeed: $id("chart-repair-speed"),
    chartTechQuality: $id("chart-tech-quality"),
    chartTopErrors: $id("chart-top-errors"),
    chartTopRework: $id("chart-top-rework"),
    tableDebuggerSummary: $id("table-debugger-summary"),
    tableRepairSummary: $id("table-repairtech-summary"),
    tableErrorSummary: $id("table-errorcode-summary"),
    tableRecurrenceRisks: $id("table-recurrence-risks"),
    overrideHeatmap: $id("override-heatmap"),
  };

  let rawEvents = [];
  let dataEnd = null;
  let quality = null;

  const chartsRenderer = new ChartsRenderer(dom);
  const dashboardRenderer = new DashboardRenderer(dom, chartsRenderer);

  function setProgress(progress) {
    dom.loadingProgress.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }

  function toggleLoading(show) {
    dom.loadingOverlay.classList.toggle("hidden", !show);
    if (!show) setProgress(0);
  }

  function showError(message) {
    dom.errorMessage.textContent = message || "";
  }

  async function handleFile(file) {
    showError("");
    toggleLoading(true);
    try {
      const parsed = await parseCsvWithWorker(file, setProgress);
      const enriched = enrich(parsed.events, parsed.quality);
      rawEvents = enriched.events;
      dataEnd = enriched.dataEnd;
      quality = enriched.quality;

      dom.uploadContainer.classList.add("hidden");
      dom.dashboardContainer.classList.remove("hidden");
      dom.btnReset.classList.remove("hidden");
      dashboardRenderer.render(rawEvents, dataEnd, quality);
    } catch (error) {
      showError(error.message || "Failed to process file.");
    } finally {
      toggleLoading(false);
    }
  }

  function reset() {
    chartsRenderer.destroyAll();
    rawEvents = [];
    dataEnd = null;
    quality = null;
    dom.fileInput.value = "";
    dom.uploadContainer.classList.remove("hidden");
    dom.dashboardContainer.classList.add("hidden");
    dom.btnReset.classList.add("hidden");
    dom.overrideHeatmap.innerHTML = "";
    showError("");
  }

  on(dom.fileInput, "change", (event) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  });

  on(dom.dropZone, "dragover", (event) => {
    event.preventDefault();
    dom.dropZone.classList.add("dragover");
  });
  on(dom.dropZone, "dragleave", () => dom.dropZone.classList.remove("dragover"));
  on(dom.dropZone, "drop", (event) => {
    event.preventDefault();
    dom.dropZone.classList.remove("dragover");
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  [dom.selectWindow, dom.inputMinSampleN, dom.inputTopN, dom.chkExcludeRoleOverlap, dom.chkExcludeNegDurations]
    .forEach((control) => on(control, "change", () => dashboardRenderer.render(rawEvents, dataEnd, quality)));

  on(dom.btnReset, "click", reset);
  registerServiceWorker();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
