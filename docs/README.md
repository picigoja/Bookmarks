# Reimplementation Documentation Hub

This folder contains the complete project and code documentation package for the `reimplementation/` build.

## Documentation Map

1. [Project Overview](./01-project-overview.md)
2. [Architecture](./02-architecture.md)
3. [Shared Modules Reference](./03-shared-modules.md)
4. [Bookmarks App Guide](./04-bookmarks-app.md)
5. [Efficiency App Guide](./05-efficiency-app.md)
6. [Worker & Performance](./06-worker-and-performance.md)
7. [Styling & Theming](./07-styling-and-theming.md)
8. [PWA & Offline Support](./08-pwa-and-offline.md)
9. [Testing & Validation](./09-testing-and-validation.md)
10. [Maintenance & Roadmap](./10-maintenance-and-roadmap.md)

---

## Quick Start

1. Build browser-ready bundles (required after source changes):
   - `powershell -ExecutionPolicy Bypass -File ../build.ps1`
2. Open `../index.html` for **Bookmarks**.
3. Open `../Efficiency Analysis/index.html` for **Efficiency Analysis**.

Both pages are static and portable from local drive (`file://`) after bundles are generated.

---

## Build + Source Entry Points

- Runtime bundles used by HTML:
  - `../dist/bookmarks.js`
  - `../dist/efficiency.js`
- Source entries for development:
  - [`../src/apps/bookmarks/app.js`](../src/apps/bookmarks/app.js)
  - [`../src/apps/efficiency/app.js`](../src/apps/efficiency/app.js)
- Shared theme controller:
  - [`../src/shared/theme/themeController.js`](../src/shared/theme/themeController.js)
- Build script:
  - [`../build.ps1`](../build.ps1)

---

## Audience

- **Product/UX owners**: start with [Project Overview](./01-project-overview.md)
- **Frontend developers**: start with [Architecture](./02-architecture.md)
- **Maintainers/debuggers**: start with [Testing & Validation](./09-testing-and-validation.md)

---

Next: [Project Overview →](./01-project-overview.md)
