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

## Community strategies and submissions

People do **not** need a Bluesky account to contribute a strategy to allneeds. There are two supported contribution paths, and both are treated as user-made/community strategies on the site.

### Account-free contribution: export and email

1. On allneeds.app, create or open a personal strategy.
2. Use **Share this strategy with Nat…**. The site downloads a small `.json` export and prepares an email to Nat.
3. Attach the downloaded `.json` file to that email and send it.
4. A maintainer reviews the submission before it is published.

To publish an approved emailed submission from this repository:

1. Put the submitted `.json` file in [`data/user-strategy-uploads/`](data/user-strategy-uploads/).
2. Commit that upload to `main`.
3. In GitHub Actions, run **Upload user submitted strategies**.
4. The workflow validates the entire batch before publishing anything. Valid strategies are added to [`src/data/userStrategies.json`](src/data/userStrategies.json), exact duplicates are skipped, and successfully processed upload files are removed from the inbox.
5. If any upload is invalid, the workflow fails before publishing or deleting the batch so the file can be corrected safely.

Do not hand-convert an unauthenticated contributor into a fake account or Bluesky identity. Repository-imported submissions are intentionally allowed to remain attributed community contributions without an account owner.

### Optional account-owned contribution

Signing in with Bluesky is optional. It gives allneeds a stable DID to associate with strategies a person chooses to save/share through their profile. Account-owned public strategies can appear in the shared feed and on the relevant need pages, while the author retains an editable personal copy in their Strategy inventory.

Bluesky is used for authentication/identity; the strategy itself is stored by allneeds. Browsing public strategies, using need pages, saving to the device, and contributing through the export/email workflow do not require Bluesky sign-in.

On need pages, user-made strategies are preferred in the default deck order: named community contributions first, then other user-made strategies, then system/editorial strategies. Pressing **Shuffle** intentionally replaces that provenance-based ordering with a shuffled deck.

The importer and **Upload user submitted strategies** workflow are a supported production path, not a legacy fallback. Changes to community strategy architecture must preserve that workflow unless the repository contract is deliberately revised.

## Customizer color contract

The Customizer is the source of truth for the site's intentional UI color roles. A feature must not introduce a standalone surface, accent, text, outline, or other themed UI color that a user cannot change through the Customizer.

- Prefer a small set of reusable functional roles over adding one editable color for every feature or component. The Customizer currently owns nine independent colors; shared surfaces and feature accents should be derived from or reuse those roles.
- New themed colors must either use an existing Customizer-owned CSS token or be derived from Customizer-owned tokens with `color-mix()`/opacity.
- If a genuinely new independent color role is needed, add it to `ThemeValues`, expose it in the Customizer, include it in every preset and saved-theme prepaint, and add regression coverage before using it in feature CSS.
- Do not hard-code a feature-specific palette color in a CSS Module as a shortcut. `--surface-raised` is derived from the quiet emphasis role, while the legacy `--peach` token now aliases the action emphasis role instead of consuming another independent Customizer slot.
- Fixed black/white values are only acceptable when they are serving a non-themed accessibility/contrast role, a neutral endpoint inside a derived mix, an icon mask, an asset/data visualization, or a safe pre-CSS fallback. They must not become an independent visual theme surface or accent.

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
