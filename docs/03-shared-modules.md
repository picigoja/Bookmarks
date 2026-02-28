# 03 — Shared Modules Reference

[← Architecture](./02-architecture.md) | [Docs Home](./README.md) | [Next: Bookmarks App →](./04-bookmarks-app.md)

## Module Index

### `src/shared/storage.js`

- `get(key, fallback)` — safe read with fallback.
- `set(key, value)` — safe write with boolean success.
- `getEnum(key, allowed, fallback)` — enum validation.
- `getJSON(key, fallback)` / `setJSON(key, value)` — JSON wrappers.

### `src/shared/dom.js`

- `$id(id)` — `getElementById` shorthand.
- `qs(root, selector)` — safe `querySelector` from root/document.
- `qsa(root, selector)` — array from `querySelectorAll`.
- `on(el, event, handler)` — guarded event bind (no-op on null).

### `src/shared/ui/debounce.js`

- `debounce(fn, delay=150)` — standard deferred execution helper.

### `src/shared/ui/format.js`

- `fmtNum(val, digits=2)`
- `fmtPct(val, digits=1)`
- `fmtDateTime(date)`

Used heavily in Efficiency table/KPI formatting.

### `src/shared/ui/glider.js`

- `createGliderTracker(config)`

Tracks active and optional hover/focus targets and writes CSS variables:
- x/y/width/height
- supports resize reflow via `requestAnimationFrame`

### Theme Modules

- `src/shared/theme/accentPresets.js`
- `src/shared/theme/themeController.js`

`ThemeController` options include:
- mode toggle ID
- accent picker root ID
- storage key map
- accent strategy (`class` or `cssVar`)
- optional custom color slider config

## Integration Notes

- Bookmarks uses `accentStrategy: "class"` with optional custom RGB override.
- Efficiency uses `accentStrategy: "cssVar"` with hex values.

## Source Links

- [`../src/shared/storage.js`](../src/shared/storage.js)
- [`../src/shared/dom.js`](../src/shared/dom.js)
- [`../src/shared/ui/glider.js`](../src/shared/ui/glider.js)
- [`../src/shared/theme/themeController.js`](../src/shared/theme/themeController.js)
