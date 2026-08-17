# allneeds.app V2 architecture

## Boundary

`natanai/nvc-app` is a reference implementation and must remain read-only from this project. V2 code lives only in `natanai/allneeds`.

The initial audit was performed against the production `backend` branch while its latest observed commit was `fbf26ce9b7ef2b5b966c3191c4334389274e184f`. Production can continue changing independently. V2 must therefore record provenance when legacy data is intentionally imported rather than assuming a permanently synchronized tree.

## Architecture decision

V2 uses React + TypeScript + Vite and remains a static site. A backend is not part of the baseline architecture. Personal data should remain device-local unless a future feature has a concrete reason to add an opt-in network service.

### Why this direction

The legacy application has a strong content/data pipeline but a presentation layer that has accumulated generated HTML, large shared and inline styles, global browser state, page-specific DOM mutation, and tightly coupled scripts. V2 keeps the domain knowledge while replacing the presentation architecture.

## Preserve from production

- Canonical feelings, needs, faux-feelings, and strategy content.
- Stable slugs and useful public URL families.
- Evidence and research metadata, including source-link validation.
- Body-cue source data and reverse-inference behavior.
- Observation cue/taxonomy data and the domain logic that can be isolated from the current editor.
- Journal normalization and historical migration knowledge.
- On-device privacy as the default persistence model.
- The tactile identity: plum/lavender canvas, rose/mint/gold/sky accents, dark outlines, generous rounding, and playful depth.
- Magnets and motion as optional enhancements, not prerequisites for navigation or comprehension.

## Do not carry forward

- Generated page markup as the primary component system.
- The legacy `build-pages.mjs` rendering architecture.
- Giant shared/page-inline CSS as a styling strategy.
- Feature state stored in page globals or `window.NVC*` APIs.
- Direct `localStorage` calls inside presentation components.
- DOM construction/mutation as the primary UI model.
- Navigation whose layout or usability depends on magnet physics.
- Mobile behavior implemented as page-specific viewport and scroll patches.

## Proposed source layout

```text
src/
  app/                  app shell, routing, providers, page focus behavior
  components/           reusable UI primitives once repetition is proven
  features/
    home/
    feelings/
    needs/
    faux-feelings/
    body-cues/
    strategies/
    journal/
    observations/
    alexithymia/
  domain/               typed models and pure domain algorithms
  data/
    adapters/           legacy/editorial-source -> V2 model conversion
    generated/          validated generated datasets, with provenance
  persistence/
    legacy/             read-only legacy format adapters
    migrations/         explicit V2 schema migrations
  styles/               global tokens/reset only; feature styles stay scoped
scripts/                 data import/build and static-output tooling
docs/                    architecture, migration notes, compatibility maps
public/                  static assets that do not belong in modules
```

Directories are added as slices need them; this is a boundary map, not a requirement to create empty abstraction layers.

## Data strategy

The CSV/evidence files in production are editorial source material, not V2's component API. V2 should:

1. import an intentional legacy snapshot;
2. validate relationships, slugs, and required fields at build time;
3. transform it into typed V2 domain objects;
4. record the source production commit used for that generated snapshot;
5. have React features consume the typed generated model, not legacy column names.

`data/index.json`, `body-regions.json`, and `reverse-inference.json` are useful reference/build outputs, but their current shapes are not automatically the permanent V2 model. Migration adapters should be allowed to understand old shapes without forcing those shapes through the new UI.

## State and persistence

- Prefer local component state for transient interaction.
- Add feature context only for state that genuinely spans a feature subtree.
- Do not add a global state library until a concrete cross-feature problem justifies one.
- All browser persistence goes through a storage/repository boundary.
- New persisted values use an explicit schema envelope (`schemaVersion`, `savedAt`, `data`).
- A future schema is reported as unsupported rather than silently reinterpreted.
- Malformed data is not silently overwritten.
- Legacy keys are read only by compatibility adapters.
- Import from production data should validate first and write to V2-owned keys only after a deliberate migration/import action.

Known production keys from the initial audit are recorded in `src/persistence/legacy/keys.ts`.

For small settings and early personal-data slices, localStorage remains reasonable. The repository boundary keeps IndexedDB available later for larger journal/history datasets without coupling components to a storage engine.

## Routing

Use browser-history URLs and retain important route families where practical:

- `/`
- `/feelings/`
- `/feelings/:slug/`
- `/feelings/body-cues/`
- `/needs/`
- `/needs/:slug/`
- `/faux-feelings/`
- `/faux-feelings/:slug/`
- `/observations/`
- `/inventory/`
- `/inventory/journal/`
- `/alexithymia-support/`

Do not use hash routing: it would unnecessarily break the public URL model.

The initial GitHub Pages build includes a `404.html` SPA fallback so deep links function during development. That fallback still returns an HTTP 404 on a first request. Before V2 replaces public reference pages, important index/detail routes should be prerendered or emitted as static HTML entry points so they receive real 200 responses and remain friendly to search/indexing and sharing.

## Styling

Use:

- a small global token layer;
- a minimal global reset/base stylesheet;
- CSS Modules for app/feature/component styles;
- semantic CSS variables rather than copying legacy selectors;
- 44px minimum touch targets;
- visible focus states;
- `prefers-reduced-motion` from the start.

The initial token file preserves the recognizable production palette and tactile border/shadow language. Typography names are retained in the stack without introducing a required third-party font request; font asset strategy can be decided separately.

## Accessibility

Accessibility is a component contract, not a late audit:

- native landmarks and controls first;
- route changes move focus to the main content region;
- keyboard behavior is tested with each interactive slice;
- controls receive accessible names from visible labels wherever possible;
- status/live regions are added only for state changes that need announcement;
- motion and drag interactions always have a non-motion, non-drag path.

## Testing

Layer tests by risk:

1. **Domain/data unit tests** — inference math, observation matching, slug/relationship validation, migrations.
2. **Persistence tests** — schema envelopes, malformed data, legacy adapters, import/export round trips.
3. **Component interaction tests** — semantic controls, focus, keyboard behavior, progressive disclosure.
4. **Accessibility checks** — automated axe-style checks plus manual keyboard/screen-reader review at milestone boundaries.
5. **End-to-end smoke tests** — mobile viewport, direct deep links, browser back/forward, import/export, and critical guided flows.

CI begins with typecheck + unit tests + production build. UI/a11y/E2E dependencies should be added when the first interactive content slice needs them rather than front-loading unused tooling.

## GitHub Pages

The app builds to static `dist/` output. The Pages workflow:

- runs on `main`;
- uses Node 24;
- installs the pinned package versions (a lockfile will be committed once dependency installation is available in the development environment);
- runs typecheck, tests, and build;
- builds with `/allneeds/` as the repository Pages base path;
- uploads `dist/` to GitHub Pages.

If V2 later moves to a custom domain root, set the build base to `/` instead of `/allneeds/`. The application reads Vite's base path for router basename so routing and asset paths stay aligned.

## Migration sequence: small vertical slices

1. **Foundation (current)** — app shell, route map, visual tokens, persistence boundary, CI/Pages.
2. **Feelings browse + detail** — import/validate canonical feeling data, search/filter, tactile list, deep links.
3. **Needs browse + detail** — evidence/source panel, categories, cross-links with feelings.
4. **Faux feelings + relationship navigation** — complete the core reference graph.
5. **Body Cues** — port inference math into pure TypeScript, rebuild controls mobile-first, then test keyboard/touch behavior.
6. **Strategy inventory** — typed personal strategy model, V2 store, legacy `nvcApp.inventory` import/export adapter.
7. **Journal** — V2 journal repository plus adapters for `journal:v2`, `nvcApp.journal`, and `alexithymiaSupportJournal`.
8. **Observations** — port the useful cue/taxonomy/matching modules first, then build a smaller accessible editor around them.
9. **Alexithymia support** — compose body cues, energy/valence, possible feelings, needs, and journaling through progressive disclosure.
10. **Personalization and magnet play** — theme/navigation customization and draggable physics as enhancements after core navigation is stable.
11. **Parity and migration hardening** — remaining content, redirects/prerender coverage, full legacy import checks, performance/a11y regression suite.

Each slice should end in a usable deployed state and should include its data adapter, UI, accessibility behavior, and tests together.

## First usable milestone

The first milestone should be a **Feelings + Needs explorer**, not the journal or the full alexithymia flow.

It should contain:

- the V2 shell/home;
- validated canonical feelings and needs data with recorded legacy provenance;
- mobile-first feelings and needs browse/search screens;
- stable `/feelings/:slug/` and `/needs/:slug/` detail routes;
- related-feeling/need links;
- need evidence/source presentation;
- reusable tactile cards/chips/search controls;
- keyboard/focus/reduced-motion behavior;
- unit/data-integrity tests and component accessibility tests;
- a deployable GitHub Pages build.

This milestone exercises the architecture's hardest reusable foundations—data transformation, public routing, cross-linking, design primitives, responsive layout, and accessibility—without prematurely coupling the app to personal-data migration.
