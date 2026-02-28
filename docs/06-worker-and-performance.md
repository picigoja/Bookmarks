# 06 — Worker & Performance

[← Efficiency App](./05-efficiency-app.md) | [Docs Home](./README.md) | [Next: Styling & Theming →](./07-styling-and-theming.md)

## Worker Purpose

`src/workers/csvWorkerSource.worker.js` moves CSV parse/normalization off the UI thread to prevent blocking on large files.

## Worker Responsibilities

- Parse CSV with PapaParse.
- Validate required headers.
- Normalize row values.
- Parse date fields into ISO strings.
- Compute initial data quality counters.
- Sort events by SN, created timestamp, repair id.
- Emit progress and result/error messages.

## Message Contract

### Main → Worker

- `{ file }`

### Worker → Main

- progress: `{ type: "progress", payload: { progress: number } }`
- result: `{ type: "result", payload: { events, quality } }`
- error: `{ type: "error", error: string }`

## Main Thread Wrapper

`src/apps/efficiency/data/parseCsv.js`:
- imports worker source text from `src/workers/csvWorkerSource.worker.js`,
- creates a Blob (`application/javascript`),
- creates worker from Blob URL,
- listens for messages,
- maps to Promise resolve/reject,
- forwards progress to optional callback,
- terminates worker and revokes Blob URL on completion/error.

This Blob strategy avoids direct `file://.../worker.js` fetches and is compatible with local-drive execution in Firefox/Chromium.

Build note: `build.ps1` configures esbuild with `--loader:.worker.js=text` so worker source is embedded into `dist/efficiency.js`.

## Performance Notes

- Parsing in worker reduces input lag and animation stalls.
- Charts are destroyed before redraw to prevent memory leaks and overlay artifacts.
- Debounce in Bookmarks search reduces unnecessary rerenders.

## Potential Enhancements

- incremental parse progress from Papa chunk callbacks,
- transferable streams for huge files,
- memoized payload sections keyed by control values.
