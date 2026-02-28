# 07 — Styling & Theming

[← Worker & Performance](./06-worker-and-performance.md) | [Docs Home](./README.md) | [Next: PWA & Offline →](./08-pwa-and-offline.md)

## CSS Layers

1. `css/common.css`
   - tokens, base colors, typography, glass effects, helper classes.
2. `css/components.css`
   - reusable controls (switches, picker labels, glider primitives, focus styles).
3. App styles
   - `css/bookmarks.css`
   - `css/efficiency.css`

## Theme System

Controlled centrally via `ThemeController`:
- toggles `theme-dark` on `documentElement`.
- syncs `aria-pressed` state for switch buttons.
- applies accent by strategy:
  - `class`: adds `accent-*` class (Bookmarks)
  - `cssVar`: sets `--theme-color` directly (Efficiency)

## Persistence Model

- Shared: `theme-mode`
- Bookmarks:
  - `bookmarks-accent-color`
  - `bookmarks-color-mode`
  - `bookmarks-custom-color`
- Efficiency:
  - `efficiency-theme-accent`

## Glider Styling

Gliders are visual overlays controlled by CSS variables:
- `--x`, `--y`, `--width`, `--height` via tracker
- active glass and hover ghost variants

## Accessibility Style Support

- consistent `:focus-visible` outlines,
- high-contrast active states,
- keyboard parity through hover/focus glider updates.

## Related Files

- [`../css/common.css`](../css/common.css)
- [`../css/components.css`](../css/components.css)
- [`../src/shared/theme/themeController.js`](../src/shared/theme/themeController.js)
