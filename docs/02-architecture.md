# 02 — Architecture

[← Project Overview](./01-project-overview.md) | [Docs Home](./README.md) | [Next: Shared Modules →](./03-shared-modules.md)

## Architectural Style

The project uses a **feature-module architecture**:

- shared concerns in `src/shared`
- feature-specific concerns in `src/apps/<app-name>`
- dedicated worker source text in `src/workers`

This avoids cross-page duplication and keeps app bootstraps small.

For local-drive portability, source modules are bundled into classic scripts in `dist/` and loaded by HTML without `type="module"`.

## Layered Structure

### 1) Shell Layer (HTML/CSS)

- Declares static structure, templates, and semantic containers.
- Loads CSS in this order:
  1. `common.css`
  2. `components.css`
  3. app CSS (`bookmarks.css` or `efficiency.css`)

### 2) App Bootstrap + Bundle Layer

Source entries:
- `src/apps/bookmarks/app.js`
- `src/apps/efficiency/app.js`

Runtime bundles:
- `dist/bookmarks.js`
- `dist/efficiency.js`

Responsibilities:
- collect DOM references,
- initialize theme,
- bind interactions,
- trigger render/update cycles.

Build responsibilities:
- resolve ES-module imports at build time,
- output classic script bundles that can run from `file://` in Firefox/Chromium.

### 3) Domain/Data Layer

- Bookmarks: filter and render helpers.
- Efficiency: schema, parse wrapper, enrich transforms, stats payload builders.

### 4) Shared Utility Layer

- Storage safety wrappers
- DOM helpers
- Glider mechanics
- Debounce
- Number/date formatting
- Theme controller and accent presets

### 5) Worker Layer

- `src/workers/csvWorkerSource.worker.js` contains CSV parsing logic.
- `src/apps/efficiency/data/parseCsv.js` imports that file as text (esbuild loader) and creates a Blob worker at runtime.
- This avoids direct `file://.../worker.js` loads that are blocked by Firefox strict-origin behavior.

## Cross-App Contracts

- Shared dark/light mode key: `theme-mode`
- App-specific accent keys:
  - `bookmarks-accent-color`
  - `efficiency-theme-accent`
- Bookmarks-only custom color keys:
  - `bookmarks-color-mode`
  - `bookmarks-custom-color`

## Rendering Strategy

- **Bookmarks:** direct DOM rendering from filtered array.
- **Efficiency:** deterministic payload generation (`buildPayload`) then renderer modules consume payload.

## Why This Architecture

- Easier testability (pure functions in filter/stats/enrich modules).
- Easier maintenance (localized feature changes).
- Better performance (worker for parse path, chart lifecycle management).

## Related Reading

- [Shared Modules](./03-shared-modules.md)
- [Bookmarks App Guide](./04-bookmarks-app.md)
- [Efficiency App Guide](./05-efficiency-app.md)
