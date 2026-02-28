# 04 — Bookmarks App Guide

[← Shared Modules](./03-shared-modules.md) | [Docs Home](./README.md) | [Next: Efficiency App →](./05-efficiency-app.md)

## Entry Point

- Source: [`../src/apps/bookmarks/app.js`](../src/apps/bookmarks/app.js)
- Runtime bundle used by HTML: `../dist/bookmarks.js`
- Build command: `powershell -ExecutionPolicy Bypass -File ../build.ps1`

## Data Source

- [`../data/bookmarks-data.js`](../data/bookmarks-data.js)
- Exports `links` as an ES module array.

## Internal Modules

- `state.js`
  - `createState(allLinks)`
  - `groupCounts(links)`
- `filter.js`
  - `scopeByGroup(links, activeGroup)`
  - `searchLinks(links, query)`
- `render/groups.js`
  - group nav rendering + active state updates
- `render/cards.js`
  - card DOM rendering + link target/rel behavior
- `render/watermark.js`
  - watermark extraction/normalization/SVG generation

## Render Rules

1. Scope links by active group.
2. Apply search only within scoped set.
3. Render cards.
4. Update result meta (`aria-live="polite"`).

## Interaction Model

- Group click toggles active group.
- Clicking active group again resets to `All`.
- Search input uses 150ms debounce.
- `Escape` clears search and re-renders.

## Watermark Rules

Priority order:
1. explicit `bg-text`
2. title
3. URL hostname

Then:
- normalize characters,
- uppercase,
- max 7 chars.

## Theming

Configured through shared `ThemeController` with:
- mode key: `theme-mode`
- accent key: `bookmarks-accent-color`
- custom mode + RGB sliders persisted

## Related CSS

- [`../css/bookmarks.css`](../css/bookmarks.css)
- [`../css/components.css`](../css/components.css)
