export function groupBy(arr, keyFn) {
  return arr.reduce((m, item) => {
    const key = keyFn(item);
    if (!m.has(key)) m.set(key, []);
    m.get(key).push(item);
    return m;
  }, new Map());
}

export function quantile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil(q * sorted.length));
  return sorted[rank - 1];
}

export function avg(values) {
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
      sameErrRecFollowed: avg(followedEligible.map((r) => r.recurrence[windowDays].sameErrorRepeat)),
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
      sameErrRecAll: avg(eligible.map((r) => r.recurrence[windowDays].sameErrorRepeat)),
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
      sameErrRepeatCount: sameErr.reduce((sum, n) => sum + (n || 0), 0),
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
        sameErrRecAll: avg(eligible.map((r) => r.recurrence[windowDays].sameErrorRepeat)),
      });
    });
  });
  return out;
}

export function buildPayload(events, dataEnd, quality, opts) {
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
    fpy: repeatRate === null ? null : 1 - repeatRate,
  };

  const topErrorVolume = [...errorSummary].sort((a, b) => b.nEvents - a.nEvents).slice(0, opts.topN);
  const topRework = [...errorSummary].sort((a, b) => b.sameErrRepeatCount - a.sameErrRepeatCount).slice(0, opts.topN);
  const techCode = buildTechCodeSummary(filtered, opts.windowDays, opts.minSampleN, topErrorVolume.map((x) => x.errorCode));

  return { opts, quality, kpis, debuggerSummary, repairSummary, errorSummary, recurrenceRisks, overrideMatrix, topErrorVolume, topRework, techCode };
}
