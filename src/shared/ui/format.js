export function fmtNum(val, digits = 2) {
  return typeof val === "number" && Number.isFinite(val) ? val.toFixed(digits) : "-";
}

export function fmtPct(val, digits = 1) {
  return typeof val === "number" && Number.isFinite(val) ? `${(val * 100).toFixed(digits)}%` : "-";
}

export function fmtDateTime(date) {
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "N/A";
}
