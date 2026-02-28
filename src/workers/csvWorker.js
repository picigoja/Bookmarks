const REQUIRED_COLUMNS = [
  "REPAIR_ID",
  "COMPUTER_SN",
  "ERROR_CODE",
  "DEBUG_TECH",
  "REPAIR_TECH",
  "CREATED",
  "DEBUGGED",
  "REPAIRED",
  "FAIL_PN",
  "PROPOSED_ACTION",
  "REPAIR_ACTION",
];

self.importScripts("https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js");

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

self.onmessage = (event) => {
  const file = event.data?.file;
  if (!file) {
    self.postMessage({ type: "error", error: "No file provided." });
    return;
  }

  self.postMessage({ type: "progress", payload: { progress: 5 } });

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    complete: (result) => {
      if (result.errors?.length) {
        self.postMessage({ type: "error", error: `CSV parse error: ${result.errors[0].message}` });
        return;
      }

      const headers = result.meta.fields || [];
      const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
      if (missing.length) {
        self.postMessage({ type: "error", error: `Missing required headers: ${missing.join(", ")}` });
        return;
      }

      self.postMessage({ type: "progress", payload: { progress: 40 } });

      const quality = {
        totalRows: result.data.length,
        missingCreated: 0,
        missingDebugged: 0,
        missingRepaired: 0,
        invalidCreated: 0,
        invalidDebugged: 0,
        invalidRepaired: 0,
      };

      const events = result.data.map((row, index) => {
        const normalized = {};
        Object.keys(row).forEach((key) => {
          const raw = row[key];
          const value = raw === undefined || raw === null ? null : String(raw).trim();
          normalized[key] = value === "" ? null : value;
        });

        const created = parseDate(normalized.CREATED);
        const debugged = parseDate(normalized.DEBUGGED);
        const repaired = parseDate(normalized.REPAIRED);

        if (!normalized.CREATED) quality.missingCreated += 1;
        if (!normalized.DEBUGGED) quality.missingDebugged += 1;
        if (!normalized.REPAIRED) quality.missingRepaired += 1;
        if (normalized.CREATED && !created) quality.invalidCreated += 1;
        if (normalized.DEBUGGED && !debugged) quality.invalidDebugged += 1;
        if (normalized.REPAIRED && !repaired) quality.invalidRepaired += 1;

        return { index, ...normalized, created, debugged, repaired };
      });

      events.sort((a, b) => {
        const snCmp = (a.COMPUTER_SN || "").localeCompare(b.COMPUTER_SN || "");
        if (snCmp !== 0) return snCmp;
        const aCreated = a.created ? new Date(a.created).getTime() : Number.MAX_SAFE_INTEGER;
        const bCreated = b.created ? new Date(b.created).getTime() : Number.MAX_SAFE_INTEGER;
        if (aCreated !== bCreated) return aCreated - bCreated;
        return (a.REPAIR_ID || "").localeCompare(b.REPAIR_ID || "");
      });

      self.postMessage({ type: "progress", payload: { progress: 100 } });
      self.postMessage({ type: "result", payload: { events, quality } });
    },
    error: (err) => {
      self.postMessage({ type: "error", error: err?.message || "CSV parse failed" });
    },
  });
};
