# allneeds.app V2

A local, parallel React rebuild of [allneeds.app](https://allneeds.app), preserving the production visual language and complete public feature set on a cleaner, mobile-first foundation.

## Repository boundary

- `natanai/nvc-app` is the production reference implementation. It is **read-only** for V2 work.
- This checkout at `C:\allneedsV2` is the V2 comparison workspace. It intentionally has no Git metadata and is not connected to a remote repository.

Production and the online `natanai/allneeds` work can continue changing independently. This local checkout remains the comparison and test source; publishing happens only when explicitly requested.

## Stack

- React
- TypeScript
- Vite
- React Router
- CSS Modules + CSS custom-property design tokens
- Vitest
- Playwright
- Static GitHub Pages deployment

Personal reflection data stays in the browser. The optional shared strategy feed reads the allneeds backend; saving a feed item always writes to local browser storage and then best-effort updates its shared add count. Bluesky profile sync is opt-in and performs no account work until sign-in or a previously active production session requires it.

## Customizer color contract

The Customizer is the source of truth for the site's intentional UI color roles. A feature must not introduce a standalone surface, accent, text, outline, or other themed UI color that a user cannot change through the Customizer.

- New themed colors must either use an existing Customizer-owned CSS token or be derived from Customizer-owned tokens with `color-mix()`/opacity.
- If a genuinely new independent color role is needed, add it to `ThemeValues`, expose it in the Customizer, include it in every preset and saved-theme prepaint, and add regression coverage before using it in feature CSS.
- Do not hard-code a feature-specific palette color in a CSS Module as a shortcut. Shared surfaces should use `--surface-raised`; the Journal/History accent uses `--peach`; other accents, ink, and outlines use their corresponding theme tokens.
- Fixed black/white values are only acceptable when they are serving a non-themed accessibility/contrast role, an icon mask, an asset/data visualization, or a safe pre-CSS fallback. They must not become an independent visual theme surface or accent.

This rule exists so changing a theme remains coherent across navigation, Journal, forms, dialogs, and future features rather than leaving visually disconnected colors behind.

## Local development

Requires Node 22.22+ (Node 24 is recommended) and pnpm through Corepack.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5173/` (or the next port Vite prints if 5173 is already in use).

Run the full foundation checks with:

```bash
pnpm check
```

After installing the local Playwright Chromium once, run the foundation and
production-browser regression layers together with `pnpm check:all`.

See [`docs/local-testing.md`](docs/local-testing.md) for the complete smoke-test checklist, production preview commands, local-data reset steps, and side-by-side comparison workflow.

See [`docs/parity-status.md`](docs/parity-status.md) for the full public-route matrix, canonical snapshot checks, and the OAuth origin boundary for local/GitHub Pages previews.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the production audit, V2 boundaries, migration sequence, persistence strategy, routing, styling, testing, and first usable milestone.
