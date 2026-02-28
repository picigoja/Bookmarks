(() => {
  // src/shared/dom.js
  var $id = (id) => document.getElementById(id);
  function qs(root, selector) {
    const context = root instanceof Element || root instanceof Document ? root : document;
    return context.querySelector(selector);
  }
  function on(el, eventName, handler, options) {
    if (!el) return;
    el.addEventListener(eventName, handler, options);
  }

  // src/workers/csvWorkerSource.worker.js
  var csvWorkerSource_worker_default = 'const REQUIRED_COLUMNS = [\n  "REPAIR_ID",\n  "COMPUTER_SN",\n  "ERROR_CODE",\n  "DEBUG_TECH",\n  "REPAIR_TECH",\n  "CREATED",\n  "DEBUGGED",\n  "REPAIRED",\n  "FAIL_PN",\n  "PROPOSED_ACTION",\n  "REPAIR_ACTION",\n];\n\nself.importScripts("https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js");\n\nfunction parseDate(value) {\n  if (!value) return null;\n  const d = new Date(value);\n  return Number.isNaN(d.getTime()) ? null : d.toISOString();\n}\n\nself.onmessage = (event) => {\n  const file = event.data?.file;\n  if (!file) {\n    self.postMessage({ type: "error", error: "No file provided." });\n    return;\n  }\n\n  self.postMessage({ type: "progress", payload: { progress: 5 } });\n\n  Papa.parse(file, {\n    header: true,\n    skipEmptyLines: true,\n    dynamicTyping: false,\n    complete: (result) => {\n      if (result.errors?.length) {\n        self.postMessage({ type: "error", error: `CSV parse error: ${result.errors[0].message}` });\n        return;\n      }\n\n      const headers = result.meta.fields || [];\n      const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));\n      if (missing.length) {\n        self.postMessage({ type: "error", error: `Missing required headers: ${missing.join(", ")}` });\n        return;\n      }\n\n      self.postMessage({ type: "progress", payload: { progress: 40 } });\n\n      const quality = {\n        totalRows: result.data.length,\n        missingCreated: 0,\n        missingDebugged: 0,\n        missingRepaired: 0,\n        invalidCreated: 0,\n        invalidDebugged: 0,\n        invalidRepaired: 0,\n      };\n\n      const events = result.data.map((row, index) => {\n        const normalized = {};\n        Object.keys(row).forEach((key) => {\n          const raw = row[key];\n          const value = raw === undefined || raw === null ? null : String(raw).trim();\n          normalized[key] = value === "" ? null : value;\n        });\n\n        const created = parseDate(normalized.CREATED);\n        const debugged = parseDate(normalized.DEBUGGED);\n        const repaired = parseDate(normalized.REPAIRED);\n\n        if (!normalized.CREATED) quality.missingCreated += 1;\n        if (!normalized.DEBUGGED) quality.missingDebugged += 1;\n        if (!normalized.REPAIRED) quality.missingRepaired += 1;\n        if (normalized.CREATED && !created) quality.invalidCreated += 1;\n        if (normalized.DEBUGGED && !debugged) quality.invalidDebugged += 1;\n        if (normalized.REPAIRED && !repaired) quality.invalidRepaired += 1;\n\n        return { index, ...normalized, created, debugged, repaired };\n      });\n\n      events.sort((a, b) => {\n        const snCmp = (a.COMPUTER_SN || "").localeCompare(b.COMPUTER_SN || "");\n        if (snCmp !== 0) return snCmp;\n        const aCreated = a.created ? new Date(a.created).getTime() : Number.MAX_SAFE_INTEGER;\n        const bCreated = b.created ? new Date(b.created).getTime() : Number.MAX_SAFE_INTEGER;\n        if (aCreated !== bCreated) return aCreated - bCreated;\n        return (a.REPAIR_ID || "").localeCompare(b.REPAIR_ID || "");\n      });\n\n      self.postMessage({ type: "progress", payload: { progress: 100 } });\n      self.postMessage({ type: "result", payload: { events, quality } });\n    },\n    error: (err) => {\n      self.postMessage({ type: "error", error: err?.message || "CSV parse failed" });\n    },\n  });\n};\n';

  // src/apps/efficiency/data/parseCsv.js
  function createCsvWorker() {
    const blob = new Blob([csvWorkerSource_worker_default], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    return { worker, workerUrl };
  }
  function cleanupWorker(worker, workerUrl) {
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
  }
  function safeCleanup(worker, workerUrl) {
    try {
      cleanupWorker(worker, workerUrl);
    } catch {
    }
  }
  function parseError(error, fallback) {
    if (error instanceof Error) return error;
    return new Error(typeof error === "string" && error ? error : fallback);
  }
  function runWorker(file, onProgress) {
    const { worker, workerUrl } = createCsvWorker();
    return new Promise((resolve, reject) => {
      worker.onmessage = (event) => {
        const { type, payload, error } = event.data || {};
        if (type === "progress") {
          onProgress?.(payload?.progress || 0);
          return;
        }
        if (type === "result") {
          safeCleanup(worker, workerUrl);
          resolve(payload);
          return;
        }
        if (type === "error") {
          safeCleanup(worker, workerUrl);
          reject(parseError(error, "CSV parse failed."));
        }
      };
      worker.onerror = (event) => {
        safeCleanup(worker, workerUrl);
        reject(parseError(event?.message, "Worker execution failed."));
      };
      worker.postMessage({ file });
    });
  }
  function parseCsvWithWorker(file, onProgress) {
    return runWorker(file, onProgress);
  }

  // src/apps/efficiency/data/schema.js
  var WINDOWS_DAYS = [7, 14, 30];

  // src/apps/efficiency/data/enrich.js
  function diffMinutes(end, start) {
    if (!end || !start) return null;
    return (new Date(end).getTime() - new Date(start).getTime()) / 6e4;
  }
  function enrich(events, qualityBase) {
    const dataEnd = events.reduce((max, e) => {
      if (!e.created) return max;
      if (!max) return new Date(e.created);
      return new Date(e.created) > max ? new Date(e.created) : max;
    }, null);
    const repairCounts = /* @__PURE__ */ new Map();
    events.forEach((e) => {
      if (!e.REPAIR_ID) return;
      repairCounts.set(e.REPAIR_ID, (repairCounts.get(e.REPAIR_ID) || 0) + 1);
    });
    let negativeDurationRows = 0;
    let duplicateRepairRows = 0;
    const enriched = events.map((event, idx) => {
      const next = idx < events.length - 1 && events[idx + 1].COMPUTER_SN === event.COMPUTER_SN ? events[idx + 1] : null;
      const debugMin = diffMinutes(event.debugged, event.created);
      const repairPhaseMin = diffMinutes(event.repaired, event.debugged);
      const cycleMin = diffMinutes(event.repaired, event.created);
      const negDurationFlag = [debugMin, repairPhaseMin, cycleMin].some((v) => v !== null && v < 0);
      if (negDurationFlag) negativeDurationRows += 1;
      const dupRepairId = !!event.REPAIR_ID && repairCounts.get(event.REPAIR_ID) > 1;
      if (dupRepairId) duplicateRepairRows += 1;
      const isOverride = event.REPAIR_ACTION && event.PROPOSED_ACTION ? Number(event.REPAIR_ACTION !== event.PROPOSED_ACTION) : null;
      const roleOverlap = event.DEBUG_TECH && event.REPAIR_TECH ? Number(event.DEBUG_TECH === event.REPAIR_TECH) : null;
      const nextCreated = next?.created || null;
      const nextErrorCode = next?.ERROR_CODE || null;
      const daysToNextFail = event.repaired && nextCreated ? (new Date(nextCreated).getTime() - new Date(event.repaired).getTime()) / 864e5 : null;
      const recurrence = {};
      WINDOWS_DAYS.forEach((w) => {
        const cutoff = dataEnd ? new Date(dataEnd.getTime() - w * 864e5) : null;
        const eligible = !!event.repaired && !!cutoff && new Date(event.repaired) <= cutoff;
        const repeat = !eligible ? null : daysToNextFail === null ? 0 : Number(daysToNextFail <= w);
        const sameErrorRepeat = !eligible ? null : Number(repeat === 1 && nextErrorCode === event.ERROR_CODE);
        recurrence[w] = { eligible, repeat, sameErrorRepeat };
      });
      return {
        ...event,
        debugMin,
        repairPhaseMin,
        cycleMin,
        isOverride,
        hasDebugger: !!event.DEBUG_TECH,
        hasRepairTech: !!event.REPAIR_TECH,
        roleOverlap,
        dupRepairId,
        negDurationFlag,
        nextCreated,
        nextErrorCode,
        daysToNextFail,
        recurrence
      };
    });
    return {
      events: enriched,
      dataEnd,
      quality: {
        ...qualityBase,
        negativeDurationRows,
        duplicateRepairRows
      }
    };
  }

  // src/apps/efficiency/render/charts.js
  var ChartsRenderer = class {
    constructor(dom) {
      this.dom = dom;
      this.instances = {};
    }
    destroyAll() {
      Object.values(this.instances).forEach((chart) => chart?.destroy());
      this.instances = {};
    }
    renderBarChart(domKey, config) {
      const canvas = this.dom[domKey];
      if (!canvas) return;
      if (this.instances[domKey]) {
        this.instances[domKey].destroy();
        this.instances[domKey] = null;
      }
      const hasData = config.labels.length && config.datasets.some((d) => d.data.some((v) => typeof v === "number"));
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!hasData) {
        ctx.save();
        ctx.fillStyle = "#666";
        ctx.font = "14px Segoe UI";
        ctx.fillText("No eligible data", 20, 30);
        ctx.restore();
        return;
      }
      this.instances[domKey] = new window.Chart(ctx, {
        type: "bar",
        data: { labels: config.labels, datasets: config.datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: config.yAsPct ? { callback: (v) => `${(v * 100).toFixed(0)}%` } : {}
            }
          }
        }
      });
    }
    render(payload) {
      const topDebug = payload.debuggerSummary.slice(0, payload.opts.topN);
      this.renderBarChart("chartDebugSpeed", {
        labels: topDebug.map((x) => x.debuggerId),
        datasets: [
          { label: "Median debug min", data: topDebug.map((x) => x.medianDebugMin), backgroundColor: "rgba(54, 162, 235, 0.65)" },
          { label: "P90 debug min", data: topDebug.map((x) => x.p90DebugMin), backgroundColor: "rgba(255, 99, 132, 0.65)" }
        ]
      });
      const topRepair = payload.repairSummary.slice(0, payload.opts.topN);
      this.renderBarChart("chartRepairSpeed", {
        labels: topRepair.map((x) => x.repairUser),
        datasets: [
          { label: "Median repair min", data: topRepair.map((x) => x.medianRepairPhaseMin), backgroundColor: "rgba(75, 192, 192, 0.65)" },
          { label: "P90 repair min", data: topRepair.map((x) => x.p90RepairPhaseMin), backgroundColor: "rgba(255, 206, 86, 0.65)" }
        ]
      });
      this.renderBarChart("chartTechQuality", {
        labels: topRepair.map((x) => x.repairUser),
        datasets: [{ label: "Same-error repeat rate", data: topRepair.map((x) => x.sameErrRecAll), backgroundColor: "rgba(153, 102, 255, 0.65)" }],
        yAsPct: true
      });
      this.renderBarChart("chartTopErrors", {
        labels: payload.topErrorVolume.map((x) => x.errorCode),
        datasets: [{ label: "Event count", data: payload.topErrorVolume.map((x) => x.nEvents), backgroundColor: "rgba(255, 159, 64, 0.7)" }]
      });
      this.renderBarChart("chartTopRework", {
        labels: payload.topRework.map((x) => x.errorCode),
        datasets: [{ label: "Same-error repeat count", data: payload.topRework.map((x) => x.sameErrRepeatCount), backgroundColor: "rgba(255, 99, 132, 0.7)" }]
      });
    }
  };

  // src/shared/ui/format.js
  function fmtNum(val, digits = 2) {
    return typeof val === "number" && Number.isFinite(val) ? val.toFixed(digits) : "-";
  }
  function fmtPct(val, digits = 1) {
    return typeof val === "number" && Number.isFinite(val) ? `${(val * 100).toFixed(digits)}%` : "-";
  }
  function fmtDateTime(date) {
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "N/A";
  }

  // src/apps/efficiency/data/stats.js
  function groupBy(arr, keyFn) {
    return arr.reduce((m, item) => {
      const key = keyFn(item);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(item);
      return m;
    }, /* @__PURE__ */ new Map());
  }
  function quantile(values, q) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const rank = Math.max(1, Math.ceil(q * sorted.length));
    return sorted[rank - 1];
  }
  function avg(values) {
    const nums = values.filter((v) => typeof v === "number");
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  function buildDebuggerSummary(events, windowDays) {
    const groups = groupBy(events.filter((e) => e.hasDebugger), (e) => e.DEBUG_TECH);
    return Array.from(groups.entries()).map(([debuggerId, rows]) => {
      const debugVals = rows.filter((r) => r.debugMin !== null && !r.negDurationFlag).map((r) => r.debugMin);
      const followedEligible = rows.filter((r) => r.isOverride === 0 && r.recurrence[windowDays].eligible);
      return {
        debuggerId,
        nEvents: rows.length,
        medianDebugMin: quantile(debugVals, 0.5),
        p90DebugMin: quantile(debugVals, 0.9),
        overrideRate: avg(rows.map((r) => r.isOverride).filter((v) => v !== null)),
        fpyFollowed: followedEligible.length ? 1 - avg(followedEligible.map((r) => r.recurrence[windowDays].repeat)) : null,
        sameErrRecFollowed: avg(followedEligible.map((r) => r.recurrence[windowDays].sameErrorRepeat))
      };
    }).sort((a, b) => b.nEvents - a.nEvents);
  }
  function buildRepairSummary(events, windowDays) {
    const groups = groupBy(events.filter((e) => e.hasRepairTech), (e) => e.REPAIR_TECH);
    return Array.from(groups.entries()).map(([repairUser, rows]) => {
      const phaseVals = rows.filter((r) => r.repairPhaseMin !== null && !r.negDurationFlag).map((r) => r.repairPhaseMin);
      const eligible = rows.filter((r) => r.recurrence[windowDays].eligible);
      return {
        repairUser,
        nEvents: rows.length,
        medianRepairPhaseMin: quantile(phaseVals, 0.5),
        p90RepairPhaseMin: quantile(phaseVals, 0.9),
        overridePerformedRate: avg(rows.map((r) => r.isOverride).filter((v) => v !== null)),
        fpyAll: eligible.length ? 1 - avg(eligible.map((r) => r.recurrence[windowDays].repeat)) : null,
        sameErrRecAll: avg(eligible.map((r) => r.recurrence[windowDays].sameErrorRepeat))
      };
    }).sort((a, b) => b.nEvents - a.nEvents);
  }
  function buildErrorSummary(events, windowDays) {
    const groups = groupBy(events.filter((e) => !!e.ERROR_CODE), (e) => e.ERROR_CODE);
    return Array.from(groups.entries()).map(([errorCode, rows]) => {
      const cycleVals = rows.filter((r) => r.cycleMin !== null && !r.negDurationFlag).map((r) => r.cycleMin);
      const eligible = rows.filter((r) => r.recurrence[windowDays].eligible);
      const repeats = eligible.map((r) => r.recurrence[windowDays].repeat);
      const sameErr = eligible.map((r) => r.recurrence[windowDays].sameErrorRepeat);
      return {
        errorCode,
        nEvents: rows.length,
        medianCycleMin: quantile(cycleVals, 0.5),
        p90CycleMin: quantile(cycleVals, 0.9),
        eligibleN: eligible.length,
        repeatRate: avg(repeats),
        sameErrRepeatRate: avg(sameErr),
        repeatCount: repeats.reduce((sum, n) => sum + (n || 0), 0),
        sameErrRepeatCount: sameErr.reduce((sum, n) => sum + (n || 0), 0)
      };
    }).sort((a, b) => b.nEvents - a.nEvents);
  }
  function buildOverrideMatrix(events) {
    const rows = events.filter((e) => e.PROPOSED_ACTION && e.REPAIR_ACTION);
    const proposedValues = [...new Set(rows.map((r) => r.PROPOSED_ACTION))].sort();
    const repairValues = [...new Set(rows.map((r) => r.REPAIR_ACTION))].sort();
    const grid = proposedValues.map((p) => repairValues.map((r) => rows.filter((x) => x.PROPOSED_ACTION === p && x.REPAIR_ACTION === r).length));
    const rowTotals = grid.map((r) => r.reduce((a, b) => a + b, 0));
    const colTotals = repairValues.map((_, j) => grid.reduce((sum, row) => sum + row[j], 0));
    const maxCell = Math.max(1, ...grid.flat());
    return { proposedValues, repairValues, grid, rowTotals, colTotals, maxCell };
  }
  function buildTechCodeSummary(events, windowDays, minSampleN, topCodes) {
    const out = [];
    topCodes.forEach((code) => {
      const byTech = groupBy(events.filter((e) => e.ERROR_CODE === code && e.REPAIR_TECH), (e) => e.REPAIR_TECH);
      byTech.forEach((rows, tech) => {
        if (rows.length < minSampleN) return;
        const vals = rows.filter((r) => r.repairPhaseMin !== null && !r.negDurationFlag).map((r) => r.repairPhaseMin);
        const eligible = rows.filter((r) => r.recurrence[windowDays].eligible);
        out.push({
          errorCode: code,
          repairUser: tech,
          nEvents: rows.length,
          medianRepairPhaseMin: quantile(vals, 0.5),
          sameErrRecAll: avg(eligible.map((r) => r.recurrence[windowDays].sameErrorRepeat))
        });
      });
    });
    return out;
  }
  function buildPayload(events, dataEnd, quality, opts) {
    const filtered = opts.excludeRoleOverlap ? events.filter((e) => e.roleOverlap !== 1) : events;
    const debuggerSummary = buildDebuggerSummary(filtered, opts.windowDays);
    const repairSummary = buildRepairSummary(filtered, opts.windowDays);
    const errorSummary = buildErrorSummary(filtered, opts.windowDays);
    const overrideMatrix = buildOverrideMatrix(events);
    const recurrenceRisks = errorSummary.filter((r) => r.eligibleN > 0).sort((a, b) => b.sameErrRepeatRate - a.sameErrRepeatRate).slice(0, opts.topN);
    const eligibleRows = filtered.filter((e) => e.recurrence[opts.windowDays].eligible);
    const repeatRate = avg(eligibleRows.map((e) => e.recurrence[opts.windowDays].repeat));
    const sameErrorRepeatRate = avg(eligibleRows.map((e) => e.recurrence[opts.windowDays].sameErrorRepeat));
    const cycleValues = filtered.filter((e) => e.cycleMin !== null).filter((e) => !e.negDurationFlag).map((e) => e.cycleMin);
    const kpis = {
      totalEvents: filtered.length,
      dataEnd,
      medianCycle: quantile(cycleValues, 0.5),
      repeatRate,
      sameErrorRepeatRate,
      fpy: repeatRate === null ? null : 1 - repeatRate
    };
    const topErrorVolume = [...errorSummary].sort((a, b) => b.nEvents - a.nEvents).slice(0, opts.topN);
    const topRework = [...errorSummary].sort((a, b) => b.sameErrRepeatCount - a.sameErrRepeatCount).slice(0, opts.topN);
    const techCode = buildTechCodeSummary(filtered, opts.windowDays, opts.minSampleN, topErrorVolume.map((x) => x.errorCode));
    return { opts, quality, kpis, debuggerSummary, repairSummary, errorSummary, recurrenceRisks, overrideMatrix, topErrorVolume, topRework, techCode };
  }

  // src/apps/efficiency/render/tables.js
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
  function renderTables(dom, payload) {
    renderTable(
      dom.tableDebuggerSummary,
      ["Debug Tech", "N", "Median Debug", "P90 Debug", "Override Rate", "FPY Followed", "SameErr Followed"],
      payload.debuggerSummary.slice(0, payload.opts.topN).map((r) => [r.debuggerId, r.nEvents, fmtNum(r.medianDebugMin, 1), fmtNum(r.p90DebugMin, 1), fmtPct(r.overrideRate), fmtPct(r.fpyFollowed), fmtPct(r.sameErrRecFollowed)])
    );
    renderTable(
      dom.tableRepairSummary,
      ["Repair Tech", "N", "Median Repair", "P90 Repair", "Override Rate", "FPY", "SameErr Rate"],
      payload.repairSummary.slice(0, payload.opts.topN).map((r) => [r.repairUser, r.nEvents, fmtNum(r.medianRepairPhaseMin, 1), fmtNum(r.p90RepairPhaseMin, 1), fmtPct(r.overridePerformedRate), fmtPct(r.fpyAll), fmtPct(r.sameErrRecAll)])
    );
    renderTable(
      dom.tableErrorSummary,
      ["Error Code", "N", "Eligible", "Median Cycle", "P90 Cycle", "Repeat Rate", "SameErr Rate", "SameErr Count"],
      payload.errorSummary.slice(0, payload.opts.topN).map((r) => [r.errorCode, r.nEvents, r.eligibleN, fmtNum(r.medianCycleMin, 1), fmtNum(r.p90CycleMin, 1), fmtPct(r.repeatRate), fmtPct(r.sameErrRepeatRate), r.sameErrRepeatCount])
    );
    renderTable(
      dom.tableRecurrenceRisks,
      ["Error Code", "Eligible N", "SameErr Rate", "SameErr Count", "Repeat Rate", "Repeat Count"],
      payload.recurrenceRisks.map((r) => [r.errorCode, r.eligibleN, fmtPct(r.sameErrRepeatRate), r.sameErrRepeatCount, fmtPct(r.repeatRate), r.repeatCount])
    );
  }

  // src/apps/efficiency/render/heatmap.js
  function renderHeatmap(container, matrix) {
    if (!container) return;
    if (!matrix.proposedValues.length || !matrix.repairValues.length) {
      container.textContent = "No eligible data";
      return;
    }
    let html = "<table><thead><tr><th>Proposed \u2193 / Repair \u2192</th>";
    html += matrix.repairValues.map((v) => `<th>${v}</th>`).join("");
    html += "<th>Total</th></tr></thead><tbody>";
    matrix.proposedValues.forEach((p, i) => {
      html += `<tr><th>${p}</th>`;
      matrix.repairValues.forEach((r, j) => {
        const value = matrix.grid[i][j];
        const intensity = value / matrix.maxCell;
        const bg = `color-mix(in srgb, var(--theme-color) ${Math.round(intensity * 70)}%, transparent)`;
        html += `<td class="${p === r ? "diag" : ""}" style="background:${bg}">${value}</td>`;
      });
      html += `<td><strong>${matrix.rowTotals[i]}</strong></td></tr>`;
    });
    html += `<tr><th>Total</th>${matrix.colTotals.map((t) => `<td><strong>${t}</strong></td>`).join("")}<td><strong>${matrix.rowTotals.reduce((a, b) => a + b, 0)}</strong></td></tr>`;
    html += "</tbody></table>";
    container.innerHTML = html;
  }

  // src/apps/efficiency/render/dashboard.js
  var DashboardRenderer = class {
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
        excludeNegDurations: true
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
        `Tech\xD7Code cells meeting min N (${payload.opts.minSampleN}): <strong>${payload.techCode.length}</strong>`
      ].join(" &nbsp;|&nbsp; ");
      this.chartsRenderer.render(payload);
      renderTables(this.dom, payload);
      renderHeatmap(this.dom.overrideHeatmap, payload.overrideMatrix);
    }
  };

  // src/shared/storage.js
  function get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }
  function set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
  function getEnum(key, allowed, fallback) {
    const value = get(key, fallback);
    return allowed.includes(value) ? value : fallback;
  }

  // src/shared/theme/accentPresets.js
  var ACCENT_CLASS_PRESETS = ["red", "green", "blue", "yellow", "purple", "orange"];

  // src/shared/theme/themeController.js
  var ThemeController = class {
    constructor(options) {
      this.options = options;
      this.root = document.documentElement;
      this.modeSwitch = $id(options.modeToggleButtonId);
      this.accentRoot = $id(options.accentPickerRootId);
      this.mode = getEnum(options.storageKeys.mode, ["day", "dark"], "day");
      this.colorMode = options.storageKeys.colorMode ? getEnum(options.storageKeys.colorMode, ["preset", "custom"], "preset") : "preset";
      this.accent = this.resolveInitialAccent();
      this.customColor = this.resolveCustomColor();
      this.customConfig = options.customColorConfig || null;
    }
    resolveInitialAccent() {
      const fallback = this.options.defaultAccent || (this.options.accentStrategy === "class" ? "red" : "#ff6b6b");
      if (this.options.accentStrategy === "class") {
        return getEnum(this.options.storageKeys.accent, ACCENT_CLASS_PRESETS, fallback);
      }
      return get(this.options.storageKeys.accent, fallback);
    }
    resolveCustomColor() {
      if (!this.options.storageKeys.customColor) return { r: 50, g: 50, b: 50 };
      const raw = get(this.options.storageKeys.customColor, "50,50,50");
      const [r, g, b] = String(raw).split(",").map((n) => Number.parseInt(n, 10));
      return [r, g, b].every((n) => Number.isFinite(n)) ? { r, g, b } : { r: 50, g: 50, b: 50 };
    }
    init() {
      this.applyMode();
      this.applyAccent();
      this.syncControls();
      on(this.modeSwitch, "click", () => {
        this.mode = this.mode === "dark" ? "day" : "dark";
        set(this.options.storageKeys.mode, this.mode);
        this.applyMode();
      });
      on(this.accentRoot, "change", (event) => {
        const input = event.target.closest(".tp-input");
        if (!input?.value) return;
        this.accent = input.value;
        set(this.options.storageKeys.accent, this.accent);
        this.applyAccent();
      });
      if (this.customConfig) {
        const colorModeSwitch = $id(this.customConfig.modeSwitchId);
        const mixer = $id(this.customConfig.mixerContainerId);
        const sliderEls = this.customConfig.sliderIds.map((id) => $id(id)).filter(Boolean);
        on(colorModeSwitch, "click", () => {
          this.colorMode = this.colorMode === "custom" ? "preset" : "custom";
          set(this.options.storageKeys.colorMode, this.colorMode);
          this.applyAccent();
          this.syncControls();
        });
        sliderEls.forEach((slider, idx) => {
          on(slider, "input", () => {
            const k = ["r", "g", "b"][idx];
            this.customColor[k] = Number.parseInt(slider.value, 10) || 0;
            this.colorMode = "custom";
            set(this.options.storageKeys.colorMode, this.colorMode);
            set(this.options.storageKeys.customColor, `${this.customColor.r},${this.customColor.g},${this.customColor.b}`);
            this.applyAccent();
            this.syncControls();
          });
        });
        if (mixer) mixer.setAttribute("aria-hidden", this.colorMode === "custom" ? "false" : "true");
      }
    }
    applyMode() {
      this.root.classList.toggle("theme-dark", this.mode === "dark");
      this.modeSwitch?.setAttribute("aria-pressed", this.mode === "dark" ? "true" : "false");
    }
    applyAccent() {
      if (this.options.accentStrategy === "class") {
        ACCENT_CLASS_PRESETS.forEach((name) => this.root.classList.remove(`accent-${name}`));
        this.root.classList.add(`accent-${this.accent}`);
        if (this.colorMode === "custom") {
          this.root.style.setProperty("--theme-color", `rgb(${this.customColor.r}, ${this.customColor.g}, ${this.customColor.b})`);
        } else {
          this.root.style.removeProperty("--theme-color");
        }
      } else {
        this.root.style.setProperty("--theme-color", this.accent);
      }
      this.syncControls();
    }
    syncControls() {
      if (this.accentRoot) {
        const selected = qs(this.accentRoot, `.tp-input[value="${this.accent}"]`);
        if (selected) selected.checked = true;
      }
      if (this.customConfig) {
        const modeSwitch = $id(this.customConfig.modeSwitchId);
        const mixer = $id(this.customConfig.mixerContainerId);
        const pickerSet = this.accentRoot;
        modeSwitch?.setAttribute("aria-pressed", this.colorMode === "custom" ? "true" : "false");
        pickerSet?.classList.toggle("theme-picker-custom", this.colorMode === "custom");
        if (mixer) mixer.setAttribute("aria-hidden", this.colorMode === "custom" ? "false" : "true");
        this.customConfig.sliderIds.forEach((id, idx) => {
          const key = ["r", "g", "b"][idx];
          const el = $id(id);
          if (el) el.value = String(this.customColor[key]);
        });
      }
    }
  };

  // src/apps/efficiency/theme.js
  function initEfficiencyTheme() {
    const theme = new ThemeController({
      modeToggleButtonId: "eaDayNightSwitch",
      accentPickerRootId: "eaThemePickerSet",
      accentStrategy: "cssVar",
      storageKeys: {
        mode: "theme-mode",
        accent: "efficiency-theme-accent"
      },
      defaultAccent: "#ff6b6b"
    });
    theme.init();
    return theme;
  }

  // src/apps/efficiency/app.js
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("../sw.js").catch(() => {
      });
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
      overrideHeatmap: $id("override-heatmap")
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
    [dom.selectWindow, dom.inputMinSampleN, dom.inputTopN, dom.chkExcludeRoleOverlap, dom.chkExcludeNegDurations].forEach((control) => on(control, "change", () => dashboardRenderer.render(rawEvents, dataEnd, quality)));
    on(dom.btnReset, "click", reset);
    registerServiceWorker();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
