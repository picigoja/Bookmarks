# 05 — Efficiency App Guide

[← Bookmarks App](./04-bookmarks-app.md) | [Docs Home](./README.md) | [Next: Worker & Performance →](./06-worker-and-performance.md)

## Entry Point

- Source: [`../src/apps/efficiency/app.js`](../src/apps/efficiency/app.js)
- Runtime bundle used by HTML: `../dist/efficiency.js`
- Build command: `powershell -ExecutionPolicy Bypass -File ../build.ps1`

## Processing Pipeline

1. User selects/drops CSV.
2. App dispatches file to worker (`parseCsvWithWorker`).
3. Worker validates schema + returns normalized events + quality counters.
4. Main thread enriches events (`enrich.js`).
5. Stats payload computed (`stats.js`).
6. Dashboard renderers update KPIs/charts/tables/heatmap.

## Module Breakdown

### Data modules

- `data/schema.js` — required column list and recurrence windows.
- `data/parseCsv.js` — worker communication wrapper.
  - Imports worker source text from `src/workers/csvWorkerSource.worker.js`.
  - Builds a Blob URL and creates `new Worker(blobUrl)` at runtime.
  - Revokes Blob URL + terminates worker after result/error.
- `data/enrich.js` — derived durations/flags/recurrence fields.
- `data/stats.js` — payload assembly and aggregate builders.

### Render modules

- `render/dashboard.js` — orchestrates page updates.
- `render/charts.js` — Chart.js lifecycle + fallback text.
- `render/tables.js` — table creation with numeric alignment.
- `render/heatmap.js` — override matrix table + intensity coloring.

### Theme wrapper

- `theme.js` — Efficiency-specific config for shared theme controller.

## Dashboard Controls

- Window days (`7/14/30`)
- Minimum sample N
- Top N limit
- Exclude role overlap
- Exclude negative durations (enforced)

## Reset Behavior

Reset button:
- destroys charts,
- clears in-memory data,
- resets file input,
- hides dashboard,
- returns user to upload panel.

## Error Handling

- Missing headers produce clear message.
- Worker parse errors bubble to UI.
- “No eligible data” placeholders appear when series/table sections are empty.

## Related CSS

- [`../css/efficiency.css`](../css/efficiency.css)
- [`../css/components.css`](../css/components.css)
