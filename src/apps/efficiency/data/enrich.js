import { WINDOWS_DAYS } from "./schema.js";

function diffMinutes(end, start) {
  if (!end || !start) return null;
  return (new Date(end).getTime() - new Date(start).getTime()) / 60000;
}

export function enrich(events, qualityBase) {
  const dataEnd = events.reduce((max, e) => {
    if (!e.created) return max;
    if (!max) return new Date(e.created);
    return new Date(e.created) > max ? new Date(e.created) : max;
  }, null);

  const repairCounts = new Map();
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
    const daysToNextFail = event.repaired && nextCreated
      ? (new Date(nextCreated).getTime() - new Date(event.repaired).getTime()) / 86400000
      : null;

    const recurrence = {};
    WINDOWS_DAYS.forEach((w) => {
      const cutoff = dataEnd ? new Date(dataEnd.getTime() - w * 86400000) : null;
      const eligible = !!event.repaired && !!cutoff && new Date(event.repaired) <= cutoff;
      const repeat = !eligible ? null : (daysToNextFail === null ? 0 : Number(daysToNextFail <= w));
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
      recurrence,
    };
  });

  return {
    events: enriched,
    dataEnd,
    quality: {
      ...qualityBase,
      negativeDurationRows,
      duplicateRepairRows,
    },
  };
}
