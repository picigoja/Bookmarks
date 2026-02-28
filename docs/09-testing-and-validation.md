# 09 — Testing & Validation

[← PWA & Offline](./08-pwa-and-offline.md) | [Docs Home](./README.md) | [Next: Maintenance & Roadmap →](./10-maintenance-and-roadmap.md)

## Manual Test Checklist

## Bookmarks

- Initial load shows all cards and group counts.
- Group click filters cards.
- Clicking active group resets to All.
- Search is scoped to active group.
- Escape clears search.
- Empty-state message appears when no matches.
- External links open with `target="_blank"` and `rel="noopener noreferrer"`.
- Theme mode persists across reload.
- Accent/custom color mode persists across reload.

## Efficiency

- File picker upload works.
- Drag/drop upload works with visual dragover state.
- Missing header CSV shows clear error.
- Loading overlay and progress bar update.
- Dashboard renders KPIs/charts/tables/heatmap.
- Controls trigger rerender.
- Reset returns to upload view and clears charts.
- Theme mode and accent persist across reload.

## Functional Validation Notes

- Enriched metrics should exclude negative durations in core summaries.
- Recurrence eligibility should follow selected window logic.
- Chart areas should display “No eligible data” when empty.

## Suggested Automated Coverage (Future)

- unit tests for `filter.js`, `watermark.js`, `stats.js`, and `enrich.js`.
- integration tests for CSV parse flow and reset flow.
- accessibility checks (keyboard traversal + aria assertions).

## Basic Debug Tips

- Rebuild bundles after source edits:
  - `powershell -ExecutionPolicy Bypass -File ../build.ps1`
- Open browser devtools for bundle load/runtime errors (`dist/bookmarks.js`, `dist/efficiency.js`).
- Confirm CSV parsing starts a Blob worker (devtools worker URL will appear as `blob:`) and no `file://.../csvWorker.js` security error appears.
- Clear service worker cache after major updates.
