import { fmtDateTime, fmtNum, fmtPct } from "../../../shared/ui/format.js";
import { buildPayload } from "../data/stats.js";
import { renderTables } from "./tables.js";
import { renderHeatmap } from "./heatmap.js";

export class DashboardRenderer {
  constructor(dom, chartsRenderer) {
    this.dom = dom;
    this.chartsRenderer = chartsRenderer;
  }

  render(rawEvents, dataEnd, quality) {
    if (!rawEvents.length) return;

    const opts = {
      windowDays: Number(this.dom.selectWindow.value) || 7,
      minSampleN: Math.max(1, Number(this.dom.inputMinSampleN.value) || 30),
      topN: Math.max(1, Number(this.dom.inputTopN.value) || 10),
      excludeRoleOverlap: !!this.dom.chkExcludeRoleOverlap.checked,
      excludeNegDurations: true,
    };

    if (!this.dom.chkExcludeNegDurations.checked) this.dom.chkExcludeNegDurations.checked = true;

    const payload = buildPayload(rawEvents, dataEnd, quality, opts);

    this.dom.kpiTotalEvents.textContent = String(payload.kpis.totalEvents);
    this.dom.kpiDataEnd.textContent = fmtDateTime(payload.kpis.dataEnd);
    this.dom.kpiMedianCycle.textContent = fmtNum(payload.kpis.medianCycle, 1);
    this.dom.kpiRepeatRate.textContent = fmtPct(payload.kpis.repeatRate);
    this.dom.kpiSameErrorRepeatRate.textContent = fmtPct(payload.kpis.sameErrorRepeatRate);
    this.dom.kpiFpy.textContent = fmtPct(payload.kpis.fpy);

    this.dom.dataQuality.innerHTML = [
      `Rows parsed: <strong>${payload.quality.totalRows}</strong>`,
      `Missing CREATED/DEBUGGED/REPAIRED: <strong>${payload.quality.missingCreated}</strong>/<strong>${payload.quality.missingDebugged}</strong>/<strong>${payload.quality.missingRepaired}</strong>`,
      `Invalid CREATED/DEBUGGED/REPAIRED: <strong>${payload.quality.invalidCreated}</strong>/<strong>${payload.quality.invalidDebugged}</strong>/<strong>${payload.quality.invalidRepaired}</strong>`,
      `Negative duration rows: <strong>${payload.quality.negativeDurationRows}</strong>`,
      `Duplicate REPAIR_ID rows: <strong>${payload.quality.duplicateRepairRows}</strong>`,
      `Tech×Code cells meeting min N (${payload.opts.minSampleN}): <strong>${payload.techCode.length}</strong>`,
    ].join(" &nbsp;|&nbsp; ");

    this.chartsRenderer.render(payload);
    renderTables(this.dom, payload);
    renderHeatmap(this.dom.overrideHeatmap, payload.overrideMatrix);
  }
}
