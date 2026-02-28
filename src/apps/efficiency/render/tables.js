import { fmtNum, fmtPct } from "../../../shared/ui/format.js";

function renderTable(table, headers, rows) {
  if (!table) return;
  if (!rows.length) {
    table.innerHTML = "<tbody><tr><td>No eligible data</td></tr></tbody>";
    return;
  }

  const thead = `<thead><tr>${headers.map((h, i) => `<th class="${i > 0 ? "num" : ""}">${h}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i > 0 ? "num" : ""}">${c ?? "-"}</td>`).join("")}</tr>`).join("")}</tbody>`;
  table.innerHTML = thead + tbody;
}

export function renderTables(dom, payload) {
  renderTable(dom.tableDebuggerSummary,
    ["Debug Tech", "N", "Median Debug", "P90 Debug", "Override Rate", "FPY Followed", "SameErr Followed"],
    payload.debuggerSummary.slice(0, payload.opts.topN).map((r) => [r.debuggerId, r.nEvents, fmtNum(r.medianDebugMin, 1), fmtNum(r.p90DebugMin, 1), fmtPct(r.overrideRate), fmtPct(r.fpyFollowed), fmtPct(r.sameErrRecFollowed)]));

  renderTable(dom.tableRepairSummary,
    ["Repair Tech", "N", "Median Repair", "P90 Repair", "Override Rate", "FPY", "SameErr Rate"],
    payload.repairSummary.slice(0, payload.opts.topN).map((r) => [r.repairUser, r.nEvents, fmtNum(r.medianRepairPhaseMin, 1), fmtNum(r.p90RepairPhaseMin, 1), fmtPct(r.overridePerformedRate), fmtPct(r.fpyAll), fmtPct(r.sameErrRecAll)]));

  renderTable(dom.tableErrorSummary,
    ["Error Code", "N", "Eligible", "Median Cycle", "P90 Cycle", "Repeat Rate", "SameErr Rate", "SameErr Count"],
    payload.errorSummary.slice(0, payload.opts.topN).map((r) => [r.errorCode, r.nEvents, r.eligibleN, fmtNum(r.medianCycleMin, 1), fmtNum(r.p90CycleMin, 1), fmtPct(r.repeatRate), fmtPct(r.sameErrRepeatRate), r.sameErrRepeatCount]));

  renderTable(dom.tableRecurrenceRisks,
    ["Error Code", "Eligible N", "SameErr Rate", "SameErr Count", "Repeat Rate", "Repeat Count"],
    payload.recurrenceRisks.map((r) => [r.errorCode, r.eligibleN, fmtPct(r.sameErrRepeatRate), r.sameErrRepeatCount, fmtPct(r.repeatRate), r.repeatCount]));
}
