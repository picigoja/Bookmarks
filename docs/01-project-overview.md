# 01 — Project Overview

[← Docs Home](./README.md) | [Next: Architecture →](./02-architecture.md)

## Purpose

This reimplementation rebuilds a two-page static suite:

1. **Bookmarks Home** — themed bookmark hub with group filtering, scoped search, and watermark cards.
2. **Efficiency Analysis** — CSV-driven analytics dashboard with charts, tables, and override heatmap.

The rewrite focuses on maintainability by modularizing logic into shared utilities and app-specific modules.

## Core Goals

- Preserve existing user behavior and visuals.
- Reduce duplicated code (theme handling, storage access, glider behavior, format helpers).
- Remove global dependency patterns (e.g., `window.links`) in favor of ES modules.
- Improve responsiveness with worker-based CSV parsing.
- Add continuity with shared navigation and theme mode persistence.
- Add baseline offline support via PWA primitives.

## Key Constraints

- Static-only hosting (no backend service).
- Must run portably from local drive (`file://`) in Firefox and Chromium browsers.
- CDN dependencies retained where needed:
  - PapaParse (loaded by worker runtime)
  - Chart.js (dashboard rendering)
- Worker bootstrap must avoid direct `file://` script URLs (Firefox strict origin policy).

## High-Level File Layout

- `../index.html` — Bookmarks page
- `../Efficiency Analysis/index.html` — Efficiency page
- `../css/` — common + component + app-specific styles
- `../data/` — static bookmark data
- `../src/shared/` — reusable utilities
- `../src/apps/bookmarks/` — bookmarks app modules
- `../src/apps/efficiency/` — efficiency app modules
- `../src/workers/` — worker source text consumed by bundle (`*.worker.js`)
- `../dist/` — browser-ready bundled scripts used by HTML pages
- `../build.ps1` — one-command bundle build script
- `../manifest.json`, `../sw.js` — PWA basics

## Runtime Flow (Summary)

- Each page loads a prebuilt bundle (`dist/bookmarks.js` or `dist/efficiency.js`).
- Bundles are generated from source entry modules via `build.ps1`.
- App entry initializes:
  - shared theme controller,
  - app state and event bindings,
  - render cycle.
- Efficiency app additionally creates a CSV Web Worker from a Blob (embedded worker source in bundle), then enriches data and renders metrics.

## Related Reading

- [Architecture](./02-architecture.md)
- [Shared Modules](./03-shared-modules.md)
- [Testing & Validation](./09-testing-and-validation.md)
