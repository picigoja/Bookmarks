# 10 — Maintenance & Roadmap

[← Testing & Validation](./09-testing-and-validation.md) | [Docs Home](./README.md)

## Maintenance Guidelines

1. Keep shared utilities generic and app-agnostic.
2. Avoid adding new global variables on `window`.
3. Prefer pure functions in data and stats modules.
4. Keep storage keys centralized in app bootstrap/theme config.
5. Preserve chart destroy/recreate lifecycle.
6. Rebuild `dist/` bundles after source edits (`powershell -ExecutionPolicy Bypass -File ../build.ps1`).
7. Update docs whenever module responsibilities change.

## How to Add a New Accent

1. Add color token in `css/common.css`.
2. Add preset in `src/shared/theme/accentPresets.js`.
3. Add picker input/label in target page HTML.
4. Add label swatch style in app CSS.

## How to Add a New KPI (Efficiency)

1. Compute metric in `src/apps/efficiency/data/stats.js` payload.
2. Add KPI card markup in `Efficiency Analysis/index.html`.
3. Bind output in `render/dashboard.js`.

## How to Add a New Shared UI Primitive

1. Place base style in `css/components.css`.
2. Keep app-specific visual adjustments in app CSS files.
3. Reuse through class-based composition.

## Known Gaps / Future Work

- mobile card-view fallback for tables can be expanded.
- stronger CSV progress granularity in worker.
- automated testing suite not yet included.
- manifest icons are placeholders.

## Documentation Update Policy

- If any entry point changes, update [Architecture](./02-architecture.md).
- If shared API changes, update [Shared Modules](./03-shared-modules.md).
- If UX behavior changes, update [Testing & Validation](./09-testing-and-validation.md).
