# 08 — PWA & Offline Support

[← Styling & Theming](./07-styling-and-theming.md) | [Docs Home](./README.md) | [Next: Testing & Validation →](./09-testing-and-validation.md)

## Manifest

- File: [`../manifest.json`](../manifest.json)
- Defines app name, short name, start URL, display mode, and theme colors.

## Service Worker

- File: [`../sw.js`](../sw.js)
- Implements cache-first fetch for selected static assets.
- Handles install/activate/fetch events.

## Registration

- Bookmarks registers `./sw.js`.
- Efficiency registers `../sw.js`.

Both are configured in their `app.js` entry scripts.

## Cached Assets

Current precache includes:
- both HTML pages,
- core CSS files,
- runtime bundles in `dist/`,
- bookmark data.

Worker source is now embedded into `dist/efficiency.js` as Blob text at build time, so no standalone worker file is precached.

## Operational Notes

- Service worker registration requires HTTP(S); it is not active when opened directly via `file://`.
- CDN assets (Chart.js, PapaParse worker import script) depend on network unless separately cached.
- Cache key bump required when changing asset list or cache strategy.

## Suggested Next Improvements

- add icons in `manifest.json`,
- add stale-while-revalidate strategy for static modules,
- versioned asset hashing for safer updates.
