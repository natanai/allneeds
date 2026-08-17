# allneeds.app V2

A parallel rebuild of [allneeds.app](https://allneeds.app) focused on a cleaner, mobile-first, accessible foundation.

## Repository boundary

- `natanai/nvc-app` is the production reference implementation. It is **read-only** for V2 work.
- `natanai/allneeds` is the V2 workspace. All V2 code and commits live here.

Production can continue changing independently while V2 is developed in small vertical slices.

## Stack

- React
- TypeScript
- Vite
- React Router
- CSS Modules + CSS custom-property design tokens
- Vitest
- Static GitHub Pages deployment

No backend is required for the baseline application. Personal reflection data should remain on the user's device wherever practical.

## Local development

Requires Node 22.22+ (Node 24 is used in CI).

```bash
npm install
npm run dev
```

Run the full foundation checks with:

```bash
npm run check
```

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the production audit, V2 boundaries, migration sequence, persistence strategy, routing, styling, testing, and first usable milestone.
